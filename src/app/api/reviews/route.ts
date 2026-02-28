import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// GET /api/reviews - Get reviews for a creator
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const creatorId = searchParams.get('creator_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const page = parseInt(searchParams.get('page') || '1')
    
    if (!creatorId) {
      return NextResponse.json(
        { error: 'creator_id is required' },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabase()
    
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data: reviews, error, count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('reviewee_id', creatorId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }
    
    // Get deal info for each review
    const dealIds = reviews?.map(r => r.deal_id) || []
    const { data: deals } = await supabase
      .from('deals')
      .select('id, title, brand_id')
      .in('id', dealIds)
    
    // Get brand info
    const brandIds = [...new Set(deals?.map(d => d.brand_id) || [])]
    const { data: brands } = await supabase
      .from('brand_profiles')
      .select('id, company_name, logo_url')
      .in('id', brandIds)
    
    // Map data
    const reviewsWithData = reviews?.map(review => {
      const deal = deals?.find(d => d.id === review.deal_id)
      const brand = brands?.find(b => b.id === deal?.brand_id)
      return {
        ...review,
        deal_title: deal?.title,
        brand_name: brand?.company_name,
        brand_logo: brand?.logo_url,
      }
    })
    
    return NextResponse.json({
      reviews: reviewsWithData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
    
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create a review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      deal_id,
      reviewer_id,
      reviewee_id,
      rating,
      comment,
      communication_rating,
      quality_rating,
      was_on_time,
      would_work_again,
    } = body
    
    // Validate required fields
    if (!deal_id || !reviewer_id || !reviewee_id || !rating || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabase()
    
    // Verify deal exists and is completed
    const { data: deal } = await supabase
      .from('deals')
      .select('*')
      .eq('id', deal_id)
      .single()
    
    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }
    
    if (deal.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only review completed deals' },
        { status: 400 }
      )
    }
    
    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('deal_id', deal_id)
      .eq('reviewer_id', reviewer_id)
      .single()
    
    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists for this deal' },
        { status: 409 }
      )
    }
    
    // Create review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        deal_id,
        reviewer_id,
        reviewee_id,
        rating,
        comment,
        communication_rating: communication_rating || null,
        quality_rating: quality_rating || null,
        was_on_time: was_on_time || null,
        would_work_again: would_work_again || null,
        is_public: true,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating review:', error)
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      )
    }
    
    // Update creator's average rating
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', reviewee_id)
      .eq('is_public', true)
    
    if (allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      
      await supabase
        .from('creator_profiles')
        .update({
          avg_rating: Math.round(avgRating * 10) / 10,
          total_reviews: allReviews.length,
        })
        .eq('id', reviewee_id)
    }
    
    return NextResponse.json({
      message: 'Review created successfully',
      review,
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
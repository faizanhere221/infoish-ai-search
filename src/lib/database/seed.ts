import pool from './connection';

export async function addSampleInfluencers() {
  const sampleInfluencers = [
    {
      username: 'fashionista_sarah',
      display_name: 'Sarah Johnson',
      bio: 'Fashion & lifestyle influencer sharing daily outfit inspiration 👗✨',
      location_country: 'United States',
      location_city: 'Los Angeles',
      verified: true,
      languages: ['English']
    },
    {
      username: 'tech_guru_mike',
      display_name: 'Mike Chen',
      bio: 'Tech reviewer & software engineer. Latest gadget reviews & programming tips 💻',
      location_country: 'Canada', 
      location_city: 'Toronto',
      verified: true,
      languages: ['English', 'Chinese']
    },
    {
      username: 'fitness_coach_anna',
      display_name: 'Anna Rodriguez',
      bio: 'Certified fitness trainer helping you achieve your health goals 💪',
      location_country: 'Spain',
      location_city: 'Barcelona', 
      verified: false,
      languages: ['Spanish', 'English']
    }
  ];

  console.log('🌱 Adding sample influencers...');

  for (const influencer of sampleInfluencers) {
    try {
      const result = await pool.query(`
        INSERT INTO influencers (username, display_name, bio, location_country, location_city, verified, languages)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        influencer.username,
        influencer.display_name, 
        influencer.bio,
        influencer.location_country,
        influencer.location_city,
        influencer.verified,
        JSON.stringify(influencer.languages)
      ]);

      console.log(`✅ Added influencer: ${influencer.display_name} (${result.rows[0].id})`);
    } catch (error) {
      console.error(`❌ Error adding influencer ${influencer.username}:`, error);
    }
  }
}

export async function addSampleSocialAccounts() {
  console.log('🌱 Adding sample social accounts...');
  
  try {
    // Get some influencers and platforms
    const influencers = await pool.query('SELECT id, username FROM influencers LIMIT 3');
    const platforms = await pool.query('SELECT id, name FROM platforms WHERE name IN ($1, $2)', ['instagram', 'youtube']);
    
    const sampleAccounts = [
      {
        influencer_id: influencers.rows[0]?.id,
        platform_id: platforms.rows.find(p => p.name === 'instagram')?.id,
        platform_username: 'fashionista_sarah',
        followers_count: 150000,
        engagement_rate: 4.2
      },
      {
        influencer_id: influencers.rows[1]?.id,
        platform_id: platforms.rows.find(p => p.name === 'youtube')?.id,
        platform_username: 'TechGuruMike',
        followers_count: 85000,
        engagement_rate: 6.8
      }
    ];

    for (const account of sampleAccounts) {
      if (account.influencer_id && account.platform_id) {
        await pool.query(`
          INSERT INTO influencer_social_accounts 
          (influencer_id, platform_id, platform_username, followers_count, engagement_rate)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          account.influencer_id,
          account.platform_id,
          account.platform_username,
          account.followers_count,
          account.engagement_rate
        ]);
        console.log(`✅ Added social account: ${account.platform_username}`);
      }
    }
  } catch (error) {
    console.error('❌ Error adding social accounts:', error);
  }
}

export async function runAllSeeds() {
  console.log('🚀 Starting database seeding...');
  
  try {
    await addSampleInfluencers();
    await addSampleSocialAccounts();
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}
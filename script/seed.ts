import { config } from 'dotenv';
import { resolve } from 'path';
import { db } from "../server/db";
import {
  adminSettings,
  siteSettings,
  series as seriesTable,
  episodes as episodesTable,
  featuredEpisodes,
  articles as articlesTable,
  users,
} from "../shared/schema";

// Load environment variables from root .env file
config({ path: resolve(process.cwd(), '.env') });

/**
 * Database Seed Script
 *
 * This script clears all existing data and seeds the database with test data.
 *
 * Test User Credentials (for sign up/login):
 * - test@example.com / password123
 * - demo@example.com / password123
 * - user@example.com / password123
 *
 * Note: Users are created with email/name only. They need to sign up through
 * the normal flow to get Ledewire tokens.
 */

async function clearDatabase() {
  console.log("🧹 Clearing existing data...");

  // Delete in order (respecting foreign key constraints)
  await db.delete(featuredEpisodes);
  console.log("  ✓ Cleared featured episodes");

  await db.delete(episodesTable);
  console.log("  ✓ Cleared episodes");

  await db.delete(articlesTable);
  console.log("  ✓ Cleared articles");

  await db.delete(seriesTable);
  console.log("  ✓ Cleared series");

  await db.delete(users);
  console.log("  ✓ Cleared users");

  // Site settings and admin settings use upsert, so we'll handle them separately
  await db.delete(siteSettings);
  console.log("  ✓ Cleared site settings");

  await db.delete(adminSettings);
  console.log("  ✓ Cleared admin settings");

  console.log("✅ Database cleared\n");
}

async function seedSiteSettings() {
  console.log("📝 Seeding site settings...");

  await db.insert(siteSettings).values({
    id: "default",
    heroHeading: "The Point with Chris Cillizza",
    heroSubheading: "In-depth political analysis and commentary. Premium insights into elections, policy, and the forces shaping American politics.",
  });

  console.log("  ✅ Created site settings\n");
}

async function seedUsers() {
  console.log("📝 Seeding users...");

  const testUsers = [
    {
      email: "test@example.com",
      name: "Test User",
    },
    {
      email: "demo@example.com",
      name: "Demo User",
    },
    {
      email: "user@example.com",
      name: "Sample User",
    },
    {
      email: "reader@example.com",
      name: "Reader User",
    },
  ];

  for (const userData of testUsers) {
    await db.insert(users).values(userData);
  }

  console.log(`  ✅ Created ${testUsers.length} test users`);
  console.log("  💡 Users can sign up/login with these emails (password: password123)\n");
}

async function seedSeries() {
  console.log("📝 Seeding series...");

  const [series1] = await db
    .insert(seriesTable)
    .values({
      title: "Breaking Down 2024",
      description: "Chris Cillizza's analysis of the 2024 presidential election - from primaries to general election. Deep dives into strategy, polling, and what it all means.",
      thumbnail: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800",
      trailerUrl: "https://vimeo.com/test-trailer-1",
      trailerType: "vimeo",
    })
    .returning();

  const [series2] = await db
    .insert(seriesTable)
    .values({
      title: "The Point",
      description: "Weekly political analysis covering the biggest stories, most important trends, and what you need to know about American politics right now.",
      thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
    })
    .returning();

  const [series3] = await db
    .insert(seriesTable)
    .values({
      title: "Inside the Race",
      description: "Exclusive interviews, campaign insights, and behind-the-scenes analysis of the 2024 presidential race.",
      thumbnail: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800",
      trailerUrl: "https://www.youtube.com/watch?v=test-campaign-trailer",
      trailerType: "youtube",
    })
    .returning();

  console.log(`  ✅ Created 3 series: "${series1.title}", "${series2.title}", "${series3.title}"\n`);

  return { series1, series2, series3 };
}

async function seedEpisodes(seriesIds: { series1: any; series2: any; series3: any }) {
  console.log("📝 Seeding episodes...");

  const episodes: Array<{ id: string }> = [];

  // Series 1: Breaking Down 2024
  const [ep1] = await db
    .insert(episodesTable)
    .values({
      seriesId: seriesIds.series1.id,
      title: "Iowa Caucus Results: What They Mean",
      description: "Breaking down the Iowa caucus results, analyzing candidate performance, and what the numbers tell us about the race ahead.",
      videoUrl: "https://vimeo.com/test-episode-1",
      videoType: "vimeo",
      price: 499, // $4.99
      thumbnail: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800",
    })
    .returning();
  episodes.push(ep1);

  const [ep2] = await db
    .insert(episodesTable)
    .values({
      seriesId: seriesIds.series1.id,
      title: "Super Tuesday Strategy",
      description: "Examining candidate strategies for Super Tuesday, delegate math, and what the path to nomination looks like for each candidate.",
      videoUrl: "https://vimeo.com/test-episode-2",
      videoType: "vimeo",
      price: 499, // $4.99
      thumbnail: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800",
    })
    .returning();
  episodes.push(ep2);

  // Series 2: The Point
  const [ep3] = await db
    .insert(episodesTable)
    .values({
      seriesId: seriesIds.series2.id,
      title: "This Week in Politics",
      description: "A roundup of the week's biggest political stories, from Capitol Hill to the campaign trail, with analysis you can't get anywhere else.",
      videoUrl: "https://vimeo.com/test-episode-3",
      videoType: "vimeo",
      price: 799, // $7.99
      thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
    })
    .returning();
  episodes.push(ep3);

  const [ep4] = await db
    .insert(episodesTable)
    .values({
      seriesId: seriesIds.series2.id,
      title: "Polling Deep Dive",
      description: "Understanding the polls: what they tell us, what they don't, and how to read between the numbers in this election cycle.",
      videoUrl: "https://vimeo.com/test-episode-4",
      videoType: "vimeo",
      price: 699, // $6.99
      thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
    })
    .returning();
  episodes.push(ep4);

  // Series 3: Inside the Race
  const [ep5] = await db
    .insert(episodesTable)
    .values({
      seriesId: seriesIds.series3.id,
      title: "Campaign Manager Roundtable",
      description: "Exclusive conversation with campaign managers discussing strategy, challenges, and what voters aren't seeing in the headlines.",
      videoUrl: "https://www.youtube.com/watch?v=test-episode-5",
      videoType: "youtube",
      price: 599, // $5.99
      thumbnail: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800",
    })
    .returning();
  episodes.push(ep5);

  console.log(`  ✅ Created ${episodes.length} episodes\n`);

  return episodes;
}

async function seedFeaturedEpisodes(episodes: any[]) {
  console.log("📝 Seeding featured episodes...");

  // Feature the first 3 episodes
  const featured = episodes.slice(0, 3);

  await db.insert(featuredEpisodes).values(
    featured.map((ep, index) => ({
      episodeId: ep.id,
      displayOrder: index,
    }))
  );

  console.log(`  ✅ Featured ${featured.length} episodes\n`);
}

async function seedArticles() {
  console.log("📝 Seeding articles...");

  const [article1] = await db
    .insert(articlesTable)
    .values({
      title: "2024 Election: The Battleground State Map",
      subheader: "Understanding the states that will decide the election",
      summary: "A comprehensive analysis of battleground states, their demographics, recent voting patterns, and what candidates need to win in November.",
      content: `
        <p>The path to 270 electoral votes runs through a handful of battleground states that will determine the outcome of the 2024 election.</p>
        <p>This analysis breaks down each state's demographics, recent voting patterns, and what both parties need to do to win.</p>
        <p>Understanding these states is essential to understanding how this election will be decided.</p>
        <p>We examine polling data, voter registration trends, and the issues that matter most in each battleground state.</p>
      `,
      category: "elections",
      price: 99, // $0.99
      thumbnail: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800",
      readTimeMinutes: 8,
      featured: 1,
      publishedAt: new Date(),
    })
    .returning();

  const [article2] = await db
    .insert(articlesTable)
    .values({
      title: "Healthcare in 2024: What Both Sides Propose",
      subheader: "Comparing healthcare policy platforms",
      summary: "A detailed comparison of healthcare proposals from both parties - examining costs, coverage, and what the plans would mean for American families.",
      content: `
        <p>Healthcare remains a defining issue in American politics and a key concern for voters across the political spectrum.</p>
        <p>This article provides an in-depth comparison of the healthcare proposals from both major parties.</p>
        <p>We break down the policy details, cost estimates, and real-world implications for different groups of Americans.</p>
        <p>Understanding these proposals is crucial for informed voting and understanding what's at stake in this election.</p>
      `,
      category: "policy",
      price: 199, // $1.99
      thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
      readTimeMinutes: 12,
      featured: 2,
      publishedAt: new Date(),
    })
    .returning();

  const [article3] = await db
    .insert(articlesTable)
    .values({
      title: "Ranking the 2024 Presidential Candidates",
      subheader: "Who's up, who's down, and why it matters",
      summary: "Chris Cillizza's latest rankings of presidential candidates based on campaign strength, polling, fundraising, and momentum.",
      content: `
        <p>Every week brings new developments that shift the dynamics of the presidential race.</p>
        <p>These rankings reflect the current state of each candidate's campaign, considering multiple factors beyond just polling.</p>
        <p>We analyze campaign infrastructure, fundraising, media presence, and political fundamentals to determine who's really leading.</p>
        <p>Rankings will be updated regularly as the race evolves and new information becomes available.</p>
      `,
      category: "candidate-rankings",
      price: 0, // Free article
      thumbnail: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800",
      readTimeMinutes: 6,
      featured: 0,
      publishedAt: new Date(),
    })
    .returning();

  const [article4] = await db
    .insert(articlesTable)
    .values({
      title: "Breaking Down the State of the Union",
      subheader: "Key themes and what they reveal about priorities",
      summary: "Analyzing the president's State of the Union address - examining the rhetoric, policy signals, and political strategy behind the speech.",
      content: `
        <p>The State of the Union address is more than just a speech - it's a roadmap of the administration's priorities and political strategy.</p>
        <p>This analysis breaks down the key themes, rhetorical choices, and policy signals embedded in this year's address.</p>
        <p>We examine what the speech tells us about the administration's agenda and how it fits into the broader political landscape.</p>
        <p>Understanding these elements helps us predict where the administration will focus energy and political capital in the months ahead.</p>
      `,
      category: "speech-analysis",
      price: 149, // $1.49
      thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
      readTimeMinutes: 10,
      featured: 0,
      publishedAt: new Date(),
    })
    .returning();

  const [article5] = await db
    .insert(articlesTable)
    .values({
      title: "Primary Calendar Strategy: What You Need to Know",
      subheader: "Understanding the primary process in 2024",
      summary: "A guide to the 2024 primary calendar, delegate allocation rules, and how candidates are strategizing to win the nomination.",
      content: `
        <p>The primary calendar shapes campaign strategy in ways that many voters don't fully understand.</p>
        <p>This article explains how the primary process works, which states matter most, and how candidates allocate resources.</p>
        <p>We break down the delegate math and explain what candidates need to do to secure the nomination.</p>
        <p>Understanding the primary process is essential to understanding how nominees are chosen and what factors drive campaign decisions.</p>
      `,
      category: "elections",
      price: 0, // Free article
      thumbnail: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800",
      readTimeMinutes: 7,
      featured: 3,
      publishedAt: new Date(),
    })
    .returning();

  const [article6] = await db
    .insert(articlesTable)
    .values({
      title: "Climate Policy in the 2024 Race",
      subheader: "Examining environmental proposals and their feasibility",
      summary: "A comprehensive analysis of climate policy proposals, their costs, benefits, and what they would mean for the economy and environment.",
      content: `
        <p>Climate change has emerged as a defining policy issue, with both parties offering very different visions for addressing it.</p>
        <p>This article provides an objective analysis of the climate proposals on the table, examining their feasibility and impact.</p>
        <p>We look at cost estimates, economic effects, environmental benefits, and political realities surrounding each proposal.</p>
        <p>Understanding the details of these policies helps voters make informed decisions about one of the most important issues facing the country.</p>
      `,
      category: "policy",
      price: 249, // $2.49
      thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
      readTimeMinutes: 14,
      featured: 0,
      publishedAt: new Date(),
    })
    .returning();

  console.log(`  ✅ Created 6 articles across all categories`);
  console.log(`     - Elections: 2 articles`);
  console.log(`     - Policy: 2 articles`);
  console.log(`     - Candidate Rankings: 1 article`);
  console.log(`     - Speech Analysis: 1 article`);
  console.log(`     - Free articles: 2`);
  console.log(`     - Paid articles: 4\n`);
}

async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // Clear all existing data
    await clearDatabase();

    // Seed in order
    await seedSiteSettings();
    await seedUsers();
    const seriesIds = await seedSeries();
    const episodes = await seedEpisodes(seriesIds);
    await seedFeaturedEpisodes(episodes);
    await seedArticles();

    console.log("✨ Seed completed successfully!\n");
    console.log("📋 Summary:");
    console.log("  ✓ Site settings initialized");
    console.log("  ✓ 4 test users created");
    console.log("  ✓ 3 series created");
    console.log("  ✓ 5 episodes created");
    console.log("  ✓ 3 featured episodes");
    console.log("  ✓ 6 articles created (all categories)\n");
    console.log("💡 Test User Credentials:");
    console.log("   - test@example.com / password123");
    console.log("   - demo@example.com / password123");
    console.log("   - user@example.com / password123");
    console.log("   - reader@example.com / password123");
    console.log("\n⚠️  Note: Users need to sign up/login to get Ledewire tokens");
    console.log("⚠️  Note: Episodes/articles use placeholder video URLs (replace with real content)");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      console.log("\n✅ Seed script finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Seed script failed:", error);
      process.exit(1);
    });
}

export { seed };

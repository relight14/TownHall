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
  contributors as contributorsTable,
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

  await db.delete(contributorsTable);
  console.log("  ✓ Cleared contributors");

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
  console.log("📝 Seeding contributors...");

  const contribs = await db.insert(contributorsTable).values([
    { name: "Maria Gonzalez", bio: "Covers state government and elections in Texas.", state: "TX" },
    { name: "James Chen", bio: "Investigative reporter covering New York politics.", state: "NY" },
    { name: "Destiny Howard", bio: "State Capitol reporter in Georgia.", state: "GA" },
    { name: "Patrick Sullivan", bio: "Covers Michigan politics and the auto industry.", state: "MI" },
    { name: "Rachel Kim", bio: "West Coast correspondent covering California policy.", state: "CA" },
    { name: "Tom Whitfield", bio: "National political correspondent.", state: "DC" },
  ]).returning();

  const [maria, james, destiny, patrick, rachel, tom] = contribs;
  console.log(`  ✅ Created ${contribs.length} contributors\n`);

  console.log("📝 Seeding articles...");

  // Helper: stagger dates so "Latest" column works
  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

  const articleData = [
    // ── FEATURED #1 — the hero ──
    {
      title: "Texas Legislature Passes Sweeping Water Rights Bill as Drought Worsens",
      subheader: "The measure would reshape how the state allocates groundwater for the first time in a century",
      summary: "After three weeks of contentious debate, the Texas House voted 89-54 to overhaul the state's century-old groundwater allocation framework, setting up a clash with agricultural interests that have long controlled water policy.",
      content: `<p>AUSTIN — After three weeks of contentious debate on the House floor, the Texas Legislature on Thursday passed a sweeping overhaul of the state's groundwater allocation framework — a move that supporters say is essential to the state's future but that opponents warn could devastate rural communities.</p><p>The bill, HB 1247, passed the House 89-54 along largely urban-rural lines and now heads to the Senate, where its fate is less certain. Governor Abbott has not indicated whether he would sign the measure.</p><p>The legislation would, for the first time since the landmark 1917 Water Code, impose state-level caps on groundwater pumping in regions where aquifer levels have dropped below sustainability thresholds. It also creates a $2.1 billion fund for water infrastructure improvements, financed through a redirected portion of the state's oil and gas severance tax.</p><p>"We can't keep pretending this problem will solve itself," said Rep. Elena Garza, the bill's primary sponsor. "The Ogallala Aquifer has dropped forty feet in some areas. Entire communities are running out of water."</p>`,
      category: "policy",
      state: "TX",
      contributorId: maria.id,
      price: 199,
      viewCount: 4280,
      readTimeMinutes: 11,
      featured: 1,
      publishedAt: daysAgo(0),
      thumbnail: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800",
    },
    // ── FEATURED #2 ──
    {
      title: "New York's Congestion Pricing Generates $100M in First Quarter, Exceeding Projections",
      subheader: "Revenue surge raises questions about whether tolls could eventually be reduced",
      summary: "Three months into the program, Manhattan's congestion pricing zone has generated significantly more revenue than expected while cutting traffic volumes by 18 percent.",
      content: `<p>NEW YORK — Manhattan's congestion pricing program generated $103 million in its first full quarter, outpacing initial projections by roughly 22 percent, according to data released Tuesday by the Metropolitan Transportation Authority.</p><p>The figures bolster the case made by program supporters that the tolling system—the first of its kind in the United States—can deliver both traffic relief and a reliable revenue stream for mass transit improvements.</p><p>Traffic entering the zone south of 60th Street fell 18 percent compared with the same period last year, while average vehicle speeds rose by nearly one-third during peak hours.</p>`,
      category: "policy",
      state: "NY",
      contributorId: james.id,
      price: 149,
      viewCount: 7620,
      readTimeMinutes: 9,
      featured: 2,
      publishedAt: daysAgo(1),
      thumbnail: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800",
    },
    // ── FEATURED #3 ──
    {
      title: "Georgia Voter Registration Surges Ahead of Special Election",
      subheader: "Both parties pour resources into suburban Atlanta district seen as bellwether",
      summary: "Voter registration in Georgia's 7th Congressional District has jumped 14 percent since January, fueled by organizing efforts on both sides ahead of a June special election.",
      content: `<p>LAWRENCEVILLE, Ga. — Voter registration in Georgia's 7th Congressional District has surged 14 percent since January, according to new data from the Secretary of State's office, as both parties pour money and organizing resources into a suburban Atlanta race that each side views as a preview of the midterm landscape.</p><p>The district, which stretches from the northeastern Atlanta suburbs into exurban Gwinnett County, has become one of the most closely watched races in the country.</p>`,
      category: "elections",
      state: "GA",
      contributorId: destiny.id,
      price: 99,
      viewCount: 5150,
      readTimeMinutes: 7,
      featured: 3,
      publishedAt: daysAgo(1),
      thumbnail: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800",
    },
    // ── Latest articles ──
    {
      title: "Michigan Auto Workers Brace for EV Transition as Three Plants Announce Retooling",
      subheader: "Union leaders negotiate retraining agreements as traditional assembly lines go quiet",
      summary: "Three major assembly plants in southeastern Michigan will shut down for retooling this summer, displacing roughly 8,000 workers as automakers accelerate the shift to electric vehicle production.",
      content: `<p>DETROIT — Three major auto assembly plants in southeastern Michigan will temporarily close for retooling this summer as part of the industry's accelerating pivot to electric vehicle production, displacing roughly 8,000 workers and testing newly negotiated union retraining agreements.</p>`,
      category: "policy",
      state: "MI",
      contributorId: patrick.id,
      price: 199,
      viewCount: 3400,
      readTimeMinutes: 10,
      featured: 0,
      publishedAt: daysAgo(2),
      thumbnail: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800",
    },
    {
      title: "California Wildfire Season Starts Early, Straining Already Thin Resources",
      subheader: "Three major fires burning simultaneously in Southern California",
      summary: "An unusually dry winter has pushed California's fire season weeks ahead of normal, with three major wildfires burning simultaneously in Los Angeles and San Bernardino counties.",
      content: `<p>LOS ANGELES — Three major wildfires are burning simultaneously across Southern California, straining firefighting resources and underscoring warnings from climate scientists that the state's fire season is arriving earlier and lasting longer.</p>`,
      category: "policy",
      state: "CA",
      contributorId: rachel.id,
      price: 149,
      viewCount: 8900,
      readTimeMinutes: 8,
      featured: 0,
      publishedAt: daysAgo(2),
      thumbnail: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800",
    },
    {
      title: "Senate Infrastructure Bill Clears Key Committee Vote on Party Lines",
      subheader: "Full Senate vote expected next week as negotiations on broadband provisions continue",
      summary: "The Senate Commerce Committee approved a $94 billion infrastructure package on a 14-12 party-line vote, sending the measure to the full chamber amid ongoing disputes over rural broadband funding.",
      content: `<p>WASHINGTON — The Senate Commerce Committee approved a $94 billion infrastructure package Thursday on a 14-12 party-line vote, advancing the measure to the full chamber where its path remains uncertain.</p>`,
      category: "policy",
      state: "DC",
      contributorId: tom.id,
      price: 199,
      viewCount: 6200,
      readTimeMinutes: 7,
      featured: 0,
      publishedAt: daysAgo(3),
      thumbnail: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800",
    },
    {
      title: "Rural Hospital Closures Accelerate Across the South, New Report Finds",
      subheader: "Fourteen rural hospitals have closed or stopped offering inpatient care this year alone",
      summary: "A new report from the Chartis Center for Rural Health documents 14 rural hospital closures so far this year, with Georgia, Tennessee, and Alabama accounting for more than half.",
      content: `<p>ATLANTA — Fourteen rural hospitals across the South have either closed entirely or stopped offering inpatient services this year, according to a new report that highlights the accelerating crisis in rural healthcare access.</p>`,
      category: "policy",
      state: "GA",
      contributorId: destiny.id,
      price: 99,
      viewCount: 3800,
      readTimeMinutes: 9,
      featured: 0,
      publishedAt: daysAgo(3),
      thumbnail: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
    },
    {
      title: "New York City Council Advances Landmark AI Hiring Law",
      subheader: "Measure would require companies to disclose when AI is used in hiring decisions",
      summary: "The New York City Council voted 38-7 to advance a first-of-its-kind law requiring employers to disclose the use of artificial intelligence in hiring and promotion decisions.",
      content: `<p>NEW YORK — The New York City Council advanced a first-of-its-kind law Thursday that would require employers to publicly disclose when they use artificial intelligence tools in hiring and promotion decisions.</p>`,
      category: "policy",
      state: "NY",
      contributorId: james.id,
      price: 149,
      viewCount: 5600,
      readTimeMinutes: 6,
      featured: 0,
      publishedAt: daysAgo(4),
      thumbnail: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800",
    },
    {
      title: "Texas Border Counties See Dramatic Drop in Migrant Crossings",
      subheader: "New federal agreement with Mexico credited with changing migration patterns",
      summary: "Border Patrol data shows a 42 percent decline in migrant encounters across Texas's Rio Grande Valley sector, though officials caution the numbers may reflect seasonal patterns.",
      content: `<p>McALLEN, Texas — Migrant encounters across the Rio Grande Valley sector have dropped 42 percent since February, according to new Border Patrol data, a decline that officials attribute to a combination of a new federal agreement with Mexico and seasonal migration patterns.</p>`,
      category: "policy",
      state: "TX",
      contributorId: maria.id,
      price: 99,
      viewCount: 9400,
      readTimeMinutes: 8,
      featured: 0,
      publishedAt: daysAgo(4),
      thumbnail: "https://images.unsplash.com/photo-1578931005019-3fba4687e3bb?w=800",
    },
    {
      title: "Michigan Governor Signs Bipartisan Skilled Trades Package into Law",
      subheader: "New programs aim to address 90,000-worker shortage in construction and manufacturing",
      summary: "Governor Whitmer signed a bipartisan package of bills creating apprenticeship tax credits and high school skilled trades academies, targeting a projected 90,000-worker shortfall.",
      content: `<p>LANSING — Governor Gretchen Whitmer on Wednesday signed a bipartisan package of bills aimed at addressing Michigan's growing skilled trades shortage, creating new apprenticeship tax credits and establishing a network of high school skilled trades academies.</p>`,
      category: "policy",
      state: "MI",
      contributorId: patrick.id,
      price: 149,
      viewCount: 2100,
      readTimeMinutes: 6,
      featured: 0,
      publishedAt: daysAgo(5),
      thumbnail: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800",
    },
    {
      title: "California Passes Nation's First AI Safety Regulation Framework",
      subheader: "Tech industry divided over bill requiring safety assessments for large AI models",
      summary: "California became the first state to pass comprehensive AI safety regulations, requiring developers of large-scale models to conduct independent safety assessments before deployment.",
      content: `<p>SACRAMENTO — California on Thursday became the first state in the nation to pass a comprehensive regulatory framework for artificial intelligence, requiring developers of large AI models to conduct independent safety assessments before commercial deployment.</p>`,
      category: "policy",
      state: "CA",
      contributorId: rachel.id,
      price: 199,
      viewCount: 11200,
      readTimeMinutes: 12,
      featured: 0,
      publishedAt: daysAgo(5),
      thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800",
    },
    {
      title: "Georgia Redistricting Case Heads to Supreme Court in October Term",
      subheader: "Justices will weigh whether state legislature violated Voting Rights Act",
      summary: "The Supreme Court agreed Monday to hear a challenge to Georgia's congressional map, a case that could reshape how courts evaluate racial gerrymandering claims nationwide.",
      content: `<p>WASHINGTON — The Supreme Court on Monday agreed to hear a challenge to Georgia's congressional district map, taking up a case that could significantly reshape how federal courts evaluate claims of racial gerrymandering under the Voting Rights Act.</p>`,
      category: "elections",
      state: "GA",
      contributorId: destiny.id,
      price: 99,
      viewCount: 4700,
      readTimeMinutes: 8,
      featured: 0,
      publishedAt: daysAgo(6),
      thumbnail: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800",
    },
    // FREE article
    {
      title: "Where the 2026 Senate Map Stands: A State-by-State Guide",
      subheader: "Which seats are competitive, which are safe, and where the surprises might come from",
      summary: "An updated look at all 34 Senate seats up for election in 2026, with ratings for each race and analysis of the factors that could flip control of the chamber.",
      content: `<p>The 2026 Senate map presents a rare opportunity for both parties, with competitive races scattered across traditionally safe territory.</p><p>Here is our updated state-by-state guide to every Senate race on the ballot, with competitiveness ratings and key dynamics driving each contest.</p><p>Democrats are defending 21 seats, including several in states that have trended rightward in recent cycles. Republicans are defending 13 seats, but face credible challengers in at least four states they assumed were safe.</p>`,
      category: "elections",
      state: "DC",
      contributorId: tom.id,
      price: 0,
      viewCount: 15300,
      readTimeMinutes: 15,
      featured: 0,
      publishedAt: daysAgo(7),
      thumbnail: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800",
    },
    {
      title: "New York Pension Fund Divests $1.2 Billion from Fossil Fuels",
      subheader: "State comptroller calls it the largest public pension divestment in U.S. history",
      summary: "New York's state pension fund completed a $1.2 billion divestment from fossil fuel companies, the largest such action by a public pension fund in U.S. history.",
      content: `<p>ALBANY — New York State Comptroller Thomas DiNapoli announced Thursday that the state pension fund has completed a $1.2 billion divestment from fossil fuel companies, a move he called "the largest public pension divestment in American history."</p>`,
      category: "policy",
      state: "NY",
      contributorId: james.id,
      price: 149,
      viewCount: 3200,
      readTimeMinutes: 7,
      featured: 0,
      publishedAt: daysAgo(8),
      thumbnail: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800",
    },
    {
      title: "Texas Attorney General Sues Federal Government Over Wind Energy Permits",
      subheader: "Lawsuit challenges Bureau of Land Management authority over West Texas wind farms",
      summary: "Texas Attorney General Ken Paxton filed a lawsuit challenging federal authority to approve wind energy projects on public lands in West Texas, arguing the permits violate state sovereignty.",
      content: `<p>AUSTIN — Texas Attorney General Ken Paxton filed a federal lawsuit Wednesday challenging the Bureau of Land Management's authority to approve wind energy projects on public lands in West Texas, opening a new front in the ongoing battle between state and federal authority over energy policy.</p>`,
      category: "policy",
      state: "TX",
      contributorId: maria.id,
      price: 99,
      viewCount: 2800,
      readTimeMinutes: 6,
      featured: 0,
      publishedAt: daysAgo(9),
      thumbnail: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=800",
    },
  ];

  for (const article of articleData) {
    await db.insert(articlesTable).values(article);
  }

  const freeCount = articleData.filter(a => a.price === 0).length;
  const paidCount = articleData.length - freeCount;
  const states = [...new Set(articleData.map(a => a.state))];

  console.log(`  ✅ Created ${articleData.length} articles`);
  console.log(`     - States: ${states.join(', ')}`);
  console.log(`     - Free: ${freeCount}, Paid: ${paidCount}`);
  console.log(`     - Featured: ${articleData.filter(a => a.featured! > 0).length}\n`);
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
    console.log("  ✓ 6 contributors");
    console.log("  ✓ 15 articles (local journalism, 5 states)\n");
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

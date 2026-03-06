import mongoose from 'mongoose';
import { config } from '../config/env';
import Talent from '../models/Talent';
import Company from '../models/Company';
import Admin from '../models/Admin';
import Job from '../models/Job';
import PipelineEntry from '../models/PipelineEntry';

// Connect to database
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Helper function to generate random date in range
const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Seed the database
const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🗑️  Dropping all collections...');
    await Promise.all([
      Talent.deleteMany({}),
      Company.deleteMany({}),
      Admin.deleteMany({}),
      Job.deleteMany({}),
      PipelineEntry.deleteMany({}),
    ]);

    // Create Companies
    console.log('👥 Creating companies...');
    const companies = await Company.create([
      {
        name: 'Acme Corp',
        email: 'demo@example.com',
        passwordHash: 'password123',
        size: '11-50',
        monthlyRevenue: '50k-100k',
      },
      {
        name: 'StartupCo',
        email: 'test@example.com',
        passwordHash: 'password123',
        size: '2-10',
        monthlyRevenue: '10k-50k',
      },
    ]);
    console.log(`✅ Created ${companies.length} companies`);

    // Create Admins
    console.log('👤 Creating admins...');
    const admins = await Admin.create([
      {
        name: 'Admin User',
        email: 'admin@remoteleverage.com',
        passwordHash: 'admin123',
        role: 'admin',
      },
      {
        name: 'Paula Martinez',
        email: 'paula@remoteleverage.com',
        passwordHash: 'admin123',
        role: 'csm',
      },
    ]);
    console.log(`✅ Created ${admins.length} admins`);

    // Create realistic talent profiles
    console.log('🌟 Creating 100 talent profiles...');

    const talentData = [
      // 1. Maria Rodriguez - Colombia - Senior Admin Assistant
      {
        firstName: 'Maria', lastName: 'Rodriguez', email: 'maria.rodriguez@example.com',
        region: 'latin_america', country: 'Colombia', city: 'Bogotá', timezone: 'America/Bogota', utcOffset: -5,
        headline: 'Senior Administrative Assistant | Calendar & Email Management Expert',
        bio: 'Dedicated administrative professional with over 6 years of experience supporting executives and business owners across the US. Specializing in calendar management, email handling, and operational efficiency, I help busy professionals reclaim their time and focus on high-impact work. I\'ve worked with clients in real estate, tech startups, and professional services. I\'m proficient in Google Workspace, Notion, Slack, and various CRM platforms. I pride myself on being proactive, detail-oriented, and an excellent communicator who anticipates needs before they arise.',
        roleCategories: ['administrative'], hourlyRate: 9, yearsOfExperience: 6, englishProficiency: 'fluent',
        skills: [
          { name: 'Calendar Management', proficiency: 'expert' },
          { name: 'Email Handling', proficiency: 'expert' },
          { name: 'Data Entry', proficiency: 'expert' },
          { name: 'Travel Booking', proficiency: 'advanced' },
          { name: 'CRM Management', proficiency: 'advanced' },
          { name: 'Basic Bookkeeping', proficiency: 'advanced' },
          { name: 'Social Media Scheduling', proficiency: 'intermediate' },
        ],
        tools: ['Google Workspace', 'Slack', 'Notion', 'Asana', 'Calendly', 'HubSpot', 'Zoom', 'Microsoft Office'],
        experience: [
          { title: 'Senior Administrative Assistant', company: 'TechVentures LLC', startDate: '2022-01', endDate: null, description: 'Managed executive calendar across 3 time zones, handled 100+ emails daily, coordinated team meetings, and maintained CRM database. Reduced scheduling conflicts by 40% through implementing a new booking system.' },
          { title: 'Administrative Assistant', company: 'GrowthPoint Digital', startDate: '2020-03', endDate: '2021-12', description: 'Supported a team of 12 with scheduling, travel arrangements, and document preparation. Maintained filing systems and processed invoices.' },
          { title: 'Office Coordinator', company: 'Meridian Solutions', startDate: '2019-06', endDate: '2020-02', description: 'Coordinated office operations, managed vendor relationships, and organized company events for a 30-person team.' },
        ],
        education: [{ degree: 'Bachelor of Business Administration', institution: 'Universidad de los Andes', year: 2018 }],
        languages: [{ name: 'Spanish', proficiency: 'native' }, { name: 'English', proficiency: 'fluent' }],
      },

      // 2. Carlos Mendez - Argentina - Sales Development Rep
      {
        firstName: 'Carlos', lastName: 'Mendez', email: 'carlos.mendez@example.com',
        region: 'latin_america', country: 'Argentina', city: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', utcOffset: -3,
        headline: 'Sales Development Representative | Cold Calling & Lead Generation Specialist',
        bio: 'Results-driven SDR with 6 years of experience generating qualified leads and driving revenue growth for B2B SaaS companies. Expert in cold calling, email outreach, and lead qualification. Consistently exceed quotas by 25%+ through strategic prospecting and relationship building. Skilled in using HubSpot, Salesforce, and LinkedIn Sales Navigator to identify and engage decision-makers.',
        roleCategories: ['sales'], hourlyRate: 11, yearsOfExperience: 6, englishProficiency: 'fluent',
        skills: [
          { name: 'Cold Calling', proficiency: 'expert' },
          { name: 'HubSpot CRM', proficiency: 'expert' },
          { name: 'Lead Qualification', proficiency: 'expert' },
          { name: 'Pipeline Management', proficiency: 'advanced' },
          { name: 'Email Outreach', proficiency: 'advanced' },
          { name: 'Salesforce', proficiency: 'advanced' },
          { name: 'LinkedIn Sales Navigator', proficiency: 'intermediate' },
        ],
        tools: ['HubSpot', 'Salesforce', 'LinkedIn Sales Navigator', 'Outreach.io', 'ZoomInfo', 'Gong'],
        experience: [
          { title: 'Senior SDR', company: 'CloudTech Solutions', startDate: '2021-06', endDate: null, description: 'Generated 150+ qualified leads per month for enterprise sales team. Achieved 130% of quota in 2023 through multi-channel outreach campaigns.' },
          { title: 'Sales Development Representative', company: 'MarketingPro SaaS', startDate: '2019-01', endDate: '2021-05', description: 'Conducted 80+ cold calls daily, qualified prospects, and scheduled demos for AEs. Maintained 45% meeting-to-opportunity conversion rate.' },
          { title: 'Inside Sales Associate', company: 'Business Growth Inc', startDate: '2018-03', endDate: '2018-12', description: 'Assisted sales team with lead research, data entry, and initial prospect outreach.' },
        ],
        education: [{ degree: 'Bachelor of Commerce', institution: 'Universidad de Buenos Aires', year: 2017 }],
        languages: [{ name: 'Spanish', proficiency: 'native' }, { name: 'English', proficiency: 'fluent' }],
      },

      // 3. Angela Reyes - Philippines - Customer Support Specialist
      {
        firstName: 'Angela', lastName: 'Reyes', email: 'angela.reyes@example.com',
        region: 'philippines', country: 'Philippines', city: 'Manila', timezone: 'Asia/Manila', utcOffset: 8,
        headline: 'Customer Support Specialist | Zendesk Expert | 4+ Years Experience',
        bio: 'Customer-focused support specialist with 4 years of experience delivering exceptional service to global clients. Expert in Zendesk, live chat, and ticket management. Maintain 98% CSAT score through empathetic problem-solving and clear communication. Experienced in SaaS, e-commerce, and fintech industries. Strong technical troubleshooting skills and ability to handle escalated issues with professionalism.',
        roleCategories: ['customer_support'], hourlyRate: 7, yearsOfExperience: 4, englishProficiency: 'native',
        skills: [
          { name: 'Zendesk', proficiency: 'expert' },
          { name: 'Live Chat', proficiency: 'expert' },
          { name: 'Ticket Management', proficiency: 'expert' },
          { name: 'Customer Onboarding', proficiency: 'advanced' },
          { name: 'Technical Troubleshooting', proficiency: 'advanced' },
          { name: 'Intercom', proficiency: 'intermediate' },
        ],
        tools: ['Zendesk', 'Intercom', 'Freshdesk', 'Slack', 'Help Scout', 'Loom'],
        experience: [
          { title: 'Senior Support Specialist', company: 'SaaS Solutions Global', startDate: '2022-01', endDate: null, description: 'Handle tier 2 support inquiries, mentor junior agents, and maintain knowledge base. Resolved 95% of tickets within SLA targets.' },
          { title: 'Customer Support Representative', company: 'E-commerce Platform Inc', startDate: '2020-06', endDate: '2021-12', description: 'Provided multi-channel support via email, chat, and phone. Processed refunds, tracked orders, and resolved customer complaints.' },
          { title: 'Customer Service Associate', company: 'Tech Support BPO', startDate: '2020-01', endDate: '2020-05', description: 'Handled inbound customer inquiries and provided product support for telecommunications company.' },
        ],
        education: [{ degree: 'Bachelor of Arts in Communication', institution: 'University of the Philippines', year: 2019 }],
        languages: [{ name: 'English', proficiency: 'native' }, { name: 'Filipino', proficiency: 'native' }],
      },

      // 4. Thabo Molefe - South Africa - Executive Assistant
      {
        firstName: 'Thabo', lastName: 'Molefe', email: 'thabo.molefe@example.com',
        region: 'south_africa', country: 'South Africa', city: 'Cape Town', timezone: 'Africa/Johannesburg', utcOffset: 2,
        headline: 'Executive Assistant | C-Suite Support | 8+ Years Experience',
        bio: 'Highly experienced executive assistant with 8 years supporting C-level executives in multinational corporations. Expert in complex calendar management, board meeting preparation, international travel coordination, and stakeholder communication. Known for discretion, professionalism, and ability to manage competing priorities in fast-paced environments. Skilled in project management and cross-functional collaboration.',
        roleCategories: ['executive'], hourlyRate: 10, yearsOfExperience: 8, englishProficiency: 'native',
        skills: [
          { name: 'Executive Scheduling', proficiency: 'expert' },
          { name: 'Travel Booking', proficiency: 'expert' },
          { name: 'Board Prep', proficiency: 'expert' },
          { name: 'Stakeholder Communication', proficiency: 'expert' },
          { name: 'Project Management', proficiency: 'advanced' },
          { name: 'Expense Management', proficiency: 'advanced' },
          { name: 'Document Preparation', proficiency: 'advanced' },
        ],
        tools: ['Google Workspace', 'Microsoft Office', 'Asana', 'Monday.com', 'DocuSign', 'Concur', 'Zoom'],
        experience: [
          { title: 'Executive Assistant to CEO', company: 'Global Enterprises Ltd', startDate: '2020-01', endDate: null, description: 'Support CEO and executive team with calendar management, meeting coordination, and strategic project support. Manage board meeting logistics and prepare executive presentations.' },
          { title: 'Senior Executive Assistant', company: 'Financial Services Group', startDate: '2017-06', endDate: '2019-12', description: 'Supported CFO with complex scheduling across multiple time zones, expense reporting, and international travel arrangements.' },
          { title: 'Administrative Coordinator', company: 'Corporate Solutions SA', startDate: '2016-01', endDate: '2017-05', description: 'Coordinated office operations, managed vendor contracts, and supported senior management team.' },
        ],
        education: [{ degree: 'Bachelor of Commerce', institution: 'University of Cape Town', year: 2015 }],
        languages: [{ name: 'English', proficiency: 'native' }, { name: 'Afrikaans', proficiency: 'fluent' }],
      },

      // 5. Fatima El-Sayed - Egypt - Social Media Manager (Part-time)
      {
        firstName: 'Fatima', lastName: 'El-Sayed', email: 'fatima.elsayed@example.com',
        region: 'egypt', country: 'Egypt', city: 'Cairo', timezone: 'Africa/Cairo', utcOffset: 2,
        headline: 'Social Media Manager | Content Creator | Instagram & TikTok Specialist',
        bio: 'Creative social media strategist with 3 years of experience helping brands grow their online presence. Specialized in Instagram, TikTok, and LinkedIn content creation. Skilled in graphic design, video editing, and copywriting. Increased follower counts by 300%+ for multiple clients through engaging content and data-driven strategies.',
        roleCategories: ['social_media'], hourlyRate: 6, yearsOfExperience: 3, englishProficiency: 'advanced',
        skills: [
          { name: 'Content Creation', proficiency: 'expert' },
          { name: 'Instagram', proficiency: 'expert' },
          { name: 'Analytics', proficiency: 'advanced' },
          { name: 'Copywriting', proficiency: 'advanced' },
          { name: 'Canva', proficiency: 'advanced' },
          { name: 'Video Editing', proficiency: 'intermediate' },
          { name: 'TikTok Marketing', proficiency: 'intermediate' },
        ],
        tools: ['Canva', 'Later', 'Hootsuite', 'Adobe Creative Suite', 'CapCut', 'Buffer'],
        experience: [
          { title: 'Social Media Manager', company: 'Digital Agency Cairo', startDate: '2022-03', endDate: null, description: 'Manage social media for 8 clients across Instagram, TikTok, and Facebook. Create content calendars, design graphics, and analyze performance metrics.' },
          { title: 'Content Creator', company: 'Freelance', startDate: '2021-06', endDate: '2022-02', description: 'Created social media content for small businesses and personal brands. Specialized in Instagram Reels and carousel posts.' },
        ],
        education: [{ degree: 'Bachelor of Marketing', institution: 'Cairo University', year: 2021 }],
        languages: [{ name: 'Arabic', proficiency: 'native' }, { name: 'English', proficiency: 'advanced' }],
      },

      // 6. Valentina Herrera - Mexico - Marketing Assistant
      {
        firstName: 'Valentina', lastName: 'Herrera', email: 'valentina.herrera@example.com',
        region: 'latin_america', country: 'Mexico', city: 'Mexico City', timezone: 'America/Mexico_City', utcOffset: -6,
        headline: 'Marketing Assistant | Email Marketing & Campaign Management',
        bio: 'Detail-oriented marketing professional with 4 years of experience in digital marketing and campaign management. Skilled in email marketing, Facebook Ads, copywriting, and campaign analysis. Experienced in B2B and B2C marketing for various industries. Strong analytical skills with ability to turn data into actionable insights.',
        roleCategories: ['marketing'], hourlyRate: 8, yearsOfExperience: 4, englishProficiency: 'fluent',
        skills: [
          { name: 'Facebook Ads', proficiency: 'expert' },
          { name: 'Email Marketing', proficiency: 'expert' },
          { name: 'Copywriting', proficiency: 'advanced' },
          { name: 'Campaign Analysis', proficiency: 'advanced' },
          { name: 'Mailchimp', proficiency: 'advanced' },
          { name: 'Google Analytics', proficiency: 'intermediate' },
        ],
        tools: ['Mailchimp', 'HubSpot', 'Facebook Ads Manager', 'Google Analytics', 'Canva', 'Hootsuite'],
        experience: [
          { title: 'Marketing Coordinator', company: 'Growth Marketing Agency', startDate: '2021-05', endDate: null, description: 'Execute email marketing campaigns, manage Facebook Ads accounts, and track campaign performance. Improved email open rates by 35% through A/B testing.' },
          { title: 'Marketing Assistant', company: 'E-commerce Startup', startDate: '2020-01', endDate: '2021-04', description: 'Assisted marketing team with campaign execution, content creation, and social media management.' },
        ],
        education: [{ degree: 'Bachelor of Marketing', institution: 'Universidad Nacional Autónoma de México', year: 2019 }],
        languages: [{ name: 'Spanish', proficiency: 'native' }, { name: 'English', proficiency: 'fluent' }],
      },

      // 7. Juan dela Cruz - Philippines - Lead Generation Specialist
      {
        firstName: 'Juan', lastName: 'dela Cruz', email: 'juan.delacruz@example.com',
        region: 'philippines', country: 'Philippines', city: 'Cebu', timezone: 'Asia/Manila', utcOffset: 8,
        headline: 'Lead Generation Specialist | Apollo.io Expert | LinkedIn Outreach',
        bio: 'Data-driven lead generation specialist with 3 years of experience building prospect lists and executing outreach campaigns. Expert in Apollo.io, LinkedIn Sales Navigator, and cold email. Generated 500+ qualified leads per month for B2B SaaS clients. Skilled in data mining, list building, and multi-channel prospecting.',
        roleCategories: ['lead_generation'], hourlyRate: 6, yearsOfExperience: 3, englishProficiency: 'fluent',
        skills: [
          { name: 'Apollo.io', proficiency: 'expert' },
          { name: 'LinkedIn Outreach', proficiency: 'expert' },
          { name: 'Cold Email', proficiency: 'advanced' },
          { name: 'Data Mining', proficiency: 'advanced' },
          { name: 'Lead Qualification', proficiency: 'advanced' },
          { name: 'ZoomInfo', proficiency: 'intermediate' },
        ],
        tools: ['Apollo.io', 'LinkedIn Sales Navigator', 'Hunter.io', 'Lemlist', 'Google Sheets'],
        experience: [
          { title: 'Lead Generation Specialist', company: 'SaaS Growth Agency', startDate: '2022-01', endDate: null, description: 'Build targeted prospect lists, execute LinkedIn and email outreach campaigns, and qualify leads for sales team. Maintained 25% response rate on outreach campaigns.' },
          { title: 'Data Research Specialist', company: 'Business Development Firm', startDate: '2021-03', endDate: '2021-12', description: 'Conducted market research, built contact lists, and supported sales team with prospect information.' },
        ],
        education: [{ degree: 'Bachelor of Business Administration', institution: 'University of San Carlos', year: 2020 }],
        languages: [{ name: 'English', proficiency: 'fluent' }, { name: 'Filipino', proficiency: 'native' }],
      },

      // 8. Sarah van der Berg - South Africa - Graphic Designer (Part-time)
      {
        firstName: 'Sarah', lastName: 'van der Berg', email: 'sarah.vandenberg@example.com',
        region: 'south_africa', country: 'South Africa', city: 'Johannesburg', timezone: 'Africa/Johannesburg', utcOffset: 2,
        headline: 'Graphic Designer | Brand Design & Social Media Graphics',
        bio: 'Creative graphic designer with 5 years of experience creating compelling visual content for brands and businesses. Proficient in Canva, Adobe Photoshop, and Illustrator. Specialized in social media graphics, brand identity, and marketing materials. Delivered 200+ design projects for clients across various industries.',
        roleCategories: ['graphic_design'], hourlyRate: 9, yearsOfExperience: 5, englishProficiency: 'native',
        skills: [
          { name: 'Canva', proficiency: 'expert' },
          { name: 'Adobe Photoshop', proficiency: 'expert' },
          { name: 'Brand Design', proficiency: 'advanced' },
          { name: 'Social Media Graphics', proficiency: 'advanced' },
          { name: 'Adobe Illustrator', proficiency: 'advanced' },
          { name: 'Figma', proficiency: 'intermediate' },
        ],
        tools: ['Canva', 'Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'InDesign'],
        experience: [
          { title: 'Freelance Graphic Designer', company: 'Self-Employed', startDate: '2020-06', endDate: null, description: 'Create brand identities, social media content, and marketing materials for small businesses and startups. Managed 10+ concurrent client projects.' },
          { title: 'Junior Designer', company: 'Creative Agency JHB', startDate: '2019-01', endDate: '2020-05', description: 'Assisted senior designers with client projects, created social media graphics, and supported branding initiatives.' },
        ],
        education: [{ degree: 'Bachelor of Fine Arts in Graphic Design', institution: 'University of Witwatersrand', year: 2018 }],
        languages: [{ name: 'English', proficiency: 'native' }, { name: 'Afrikaans', proficiency: 'native' }],
      },

      // 9. Ahmed Hassan - Egypt - Bookkeeper
      {
        firstName: 'Ahmed', lastName: 'Hassan', email: 'ahmed.hassan@example.com',
        region: 'egypt', country: 'Egypt', city: 'Alexandria', timezone: 'Africa/Cairo', utcOffset: 2,
        headline: 'Bookkeeper | QuickBooks & Xero Specialist',
        bio: 'Detail-oriented bookkeeper with 4 years of experience managing financial records for small to medium businesses. Expert in QuickBooks and Xero with strong understanding of accounting principles. Skilled in accounts payable/receivable, financial reporting, and bank reconciliation. Helped clients save 15+ hours per month through efficient bookkeeping processes.',
        roleCategories: ['bookkeeping_accounting'], hourlyRate: 7, yearsOfExperience: 4, englishProficiency: 'advanced',
        skills: [
          { name: 'QuickBooks', proficiency: 'expert' },
          { name: 'Xero', proficiency: 'expert' },
          { name: 'Financial Reporting', proficiency: 'advanced' },
          { name: 'Invoicing', proficiency: 'advanced' },
          { name: 'Bank Reconciliation', proficiency: 'advanced' },
          { name: 'Accounts Payable', proficiency: 'intermediate' },
        ],
        tools: ['QuickBooks', 'Xero', 'Excel', 'Google Sheets', 'FreshBooks'],
        experience: [
          { title: 'Bookkeeper', company: 'Virtual Accounting Services', startDate: '2021-03', endDate: null, description: 'Manage books for 12 clients including invoicing, expense tracking, bank reconciliation, and monthly financial reports.' },
          { title: 'Accounting Assistant', company: 'SME Consulting Group', startDate: '2020-01', endDate: '2021-02', description: 'Assisted with accounts payable/receivable, data entry, and financial record keeping for multiple clients.' },
        ],
        education: [{ degree: 'Bachelor of Accounting', institution: 'Alexandria University', year: 2019 }],
        languages: [{ name: 'Arabic', proficiency: 'native' }, { name: 'English', proficiency: 'advanced' }],
      },

      // 10. Camila Flores - Chile - Real Estate VA
      {
        firstName: 'Camila', lastName: 'Flores', email: 'camila.flores@example.com',
        region: 'latin_america', country: 'Chile', city: 'Santiago', timezone: 'America/Santiago', utcOffset: -3,
        headline: 'Real Estate Virtual Assistant | Transaction Coordination',
        bio: 'Experienced real estate virtual assistant with 3 years supporting real estate agents and brokers. Skilled in MLS listings, CRM management, transaction coordination, and client follow-up. Proficient in real estate software and familiar with US real estate processes. Helped agents close 50+ transactions through efficient administrative support.',
        roleCategories: ['real_estate'], hourlyRate: 8, yearsOfExperience: 3, englishProficiency: 'fluent',
        skills: [
          { name: 'MLS Listings', proficiency: 'expert' },
          { name: 'CRM Management', proficiency: 'expert' },
          { name: 'Transaction Coordination', proficiency: 'advanced' },
          { name: 'Client Follow-up', proficiency: 'advanced' },
          { name: 'Property Research', proficiency: 'advanced' },
          { name: 'Contract Management', proficiency: 'intermediate' },
        ],
        tools: ['Zillow', 'Follow Up Boss', 'Dotloop', 'DocuSign', 'Google Workspace', 'Slack'],
        experience: [
          { title: 'Real Estate VA', company: 'Virtual RE Solutions', startDate: '2021-09', endDate: null, description: 'Support 4 real estate agents with listing management, client communication, transaction coordination, and database management.' },
          { title: 'Administrative Assistant', company: 'Property Management Co', startDate: '2021-01', endDate: '2021-08', description: 'Assisted property managers with tenant communications, lease processing, and administrative tasks.' },
        ],
        education: [{ degree: 'Bachelor of Business', institution: 'Universidad de Chile', year: 2020 }],
        languages: [{ name: 'Spanish', proficiency: 'native' }, { name: 'English', proficiency: 'fluent' }],
      },

      // 11. Patricia Santos - Philippines - Executive Assistant
      {
        firstName: 'Patricia', lastName: 'Santos', email: 'patricia.santos@example.com',
        region: 'philippines', country: 'Philippines', city: 'Davao', timezone: 'Asia/Manila', utcOffset: 8,
        headline: 'Executive Assistant | Google Workspace & Notion Expert',
        bio: 'Organized and proactive executive assistant with 7 years of experience supporting busy executives and entrepreneurs. Expert in Google Workspace, Notion, and project management. Skilled in calendar optimization, meeting coordination, travel planning, and workflow automation. Known for anticipating needs and maintaining seamless operations.',
        roleCategories: ['executive'], hourlyRate: 8, yearsOfExperience: 7, englishProficiency: 'fluent',
        skills: [
          { name: 'Google Workspace', proficiency: 'expert' },
          { name: 'Notion', proficiency: 'expert' },
          { name: 'Project Management', proficiency: 'advanced' },
          { name: 'Meeting Coordination', proficiency: 'advanced' },
          { name: 'Travel Planning', proficiency: 'advanced' },
          { name: 'Workflow Automation', proficiency: 'intermediate' },
        ],
        tools: ['Google Workspace', 'Notion', 'Asana', 'Monday.com', 'Slack', 'Loom', 'Calendly'],
        experience: [
          { title: 'Executive Assistant', company: 'Tech Startup Inc', startDate: '2019-06', endDate: null, description: 'Support founder and executive team with calendar management, project coordination, and operational tasks. Implemented Notion workspace that improved team productivity by 30%.' },
          { title: 'Virtual Executive Assistant', company: 'Remote Work Agency', startDate: '2017-03', endDate: '2019-05', description: 'Provided EA services to multiple clients including scheduling, email management, and travel booking.' },
        ],
        education: [{ degree: 'Bachelor of Business Administration', institution: 'University of Mindanao', year: 2016 }],
        languages: [{ name: 'English', proficiency: 'fluent' }, { name: 'Filipino', proficiency: 'native' }],
      },

      // 12. Diego Morales - Colombia - Customer Support Lead
      {
        firstName: 'Diego', lastName: 'Morales', email: 'diego.morales@example.com',
        region: 'latin_america', country: 'Colombia', city: 'Medellín', timezone: 'America/Bogota', utcOffset: -5,
        headline: 'Customer Support Lead | Team Training & QA Specialist',
        bio: 'Customer support leader with 6 years of experience building and managing remote support teams. Expert in Intercom, Salesforce, team training, and quality assurance. Implemented processes that improved CSAT scores from 85% to 96%. Skilled in creating training materials, conducting performance reviews, and scaling support operations.',
        roleCategories: ['customer_support'], hourlyRate: 10, yearsOfExperience: 6, englishProficiency: 'native',
        skills: [
          { name: 'Intercom', proficiency: 'expert' },
          { name: 'Salesforce', proficiency: 'expert' },
          { name: 'Team Training', proficiency: 'expert' },
          { name: 'QA Reviews', proficiency: 'advanced' },
          { name: 'Process Documentation', proficiency: 'advanced' },
          { name: 'Performance Management', proficiency: 'advanced' },
        ],
        tools: ['Intercom', 'Salesforce', 'Zendesk', 'Slack', 'Notion', 'Loom', 'Google Workspace'],
        experience: [
          { title: 'Customer Support Team Lead', company: 'SaaS Platform Global', startDate: '2021-01', endDate: null, description: 'Lead team of 8 support agents, conduct training sessions, perform QA reviews, and optimize support processes. Reduced average response time by 45%.' },
          { title: 'Senior Support Specialist', company: 'Fintech Startup', startDate: '2019-03', endDate: '2020-12', description: 'Handled escalated customer issues, mentored junior agents, and created knowledge base articles.' },
          { title: 'Customer Support Representative', company: 'E-commerce Company', startDate: '2018-01', endDate: '2019-02', description: 'Provided customer support via email and chat, processed orders, and resolved customer complaints.' },
        ],
        education: [{ degree: 'Bachelor of Communications', institution: 'Universidad EAFIT', year: 2017 }],
        languages: [{ name: 'Spanish', proficiency: 'native' }, { name: 'English', proficiency: 'native' }],
      },
    ];

    // For demonstration, I'll create a subset and then you can expand
    // In production, you'd want all 100 with proper distribution
    const talents = await Talent.create(talentData.map(t => ({
      ...t,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${t.firstName}${t.lastName}`,
      availability: Math.random() > 0.35 ? 'full_time' : 'part_time',
      isImmediatelyAvailable: Math.random() > 0.6,
      weeklyHours: Math.random() > 0.35 ? 40 : 20,
      vettingReport: {
        englishScore: 4.0 + Math.random(),
        skillsAssessmentPassed: true,
        backgroundVerified: true,
        remoteWorkHistoryConfirmed: true,
        referenceChecked: true,
        rlRating: 'Top 5%',
        vettedDate: randomDate(new Date('2023-01-01'), new Date('2024-12-01')),
      },
      status: 'active',
    })));

    // Create additional 88 talents to reach 100 total (12 detailed + 88 generic)
    // Region-appropriate names for realistic demo data
    const latinAmericaNames: [string, string, string, string][] = [
      ['Sofia', 'Gutierrez', 'Colombia', 'Bogotá'], ['Andres', 'Lopez', 'Colombia', 'Medellín'],
      ['Isabella', 'Martinez', 'Mexico', 'Guadalajara'], ['Diego', 'Ramirez', 'Argentina', 'Córdoba'],
      ['Lucia', 'Fernandez', 'Chile', 'Valparaíso'], ['Sebastian', 'Torres', 'Colombia', 'Cali'],
      ['Mariana', 'Sanchez', 'Mexico', 'Monterrey'], ['Gabriel', 'Castro', 'Argentina', 'Rosario'],
      ['Paula', 'Vargas', 'Colombia', 'Barranquilla'], ['Nicolas', 'Rojas', 'Chile', 'Santiago'],
      ['Andrea', 'Jimenez', 'Mexico', 'Puebla'], ['Mateo', 'Reyes', 'Colombia', 'Cartagena'],
      ['Laura', 'Diaz', 'Argentina', 'Mendoza'], ['Felipe', 'Herrera', 'Chile', 'Concepción'],
      ['Daniela', 'Ortiz', 'Mexico', 'Querétaro'], ['Alejandro', 'Moreno', 'Colombia', 'Bucaramanga'],
      ['Natalia', 'Ruiz', 'Argentina', 'La Plata'], ['Santiago', 'Gomez', 'Mexico', 'Cancún'],
      ['Camilo', 'Perez', 'Colombia', 'Pereira'], ['Juliana', 'Cruz', 'Chile', 'Antofagasta'],
      ['Ricardo', 'Navarro', 'Mexico', 'Mérida'], ['Elena', 'Paredes', 'Colombia', 'Manizales'],
      ['Emilia', 'Romero', 'Argentina', 'Tucumán'], ['Oscar', 'Acosta', 'Mexico', 'León'],
      ['Valeria', 'Medina', 'Colombia', 'Santa Marta'], ['Bruno', 'Rios', 'Chile', 'Temuco'],
      ['Ana', 'Castillo', 'Mexico', 'Tijuana'], ['Ivan', 'Delgado', 'Argentina', 'Salta'],
      ['Gabriela', 'Pineda', 'Colombia', 'Ibagué'], ['Marco', 'Suarez', 'Mexico', 'Oaxaca'],
      ['Carolina', 'Aguilar', 'Chile', 'Viña del Mar'], ['Rafael', 'Cardenas', 'Colombia', 'Villavicencio'],
      ['Monica', 'Vega', 'Argentina', 'Mar del Plata'], ['Fernanda', 'Silva', 'Mexico', 'Toluca'],
      ['Tomas', 'Mendoza', 'Colombia', 'Pasto'], ['Adriana', 'Guerrero', 'Chile', 'Iquique'],
      ['Luis', 'Estrada', 'Mexico', 'Aguascalientes'], ['Catalina', 'Arias', 'Colombia', 'Cúcuta'],
      ['Joaquin', 'Figueroa', 'Argentina', 'Santa Fe'], ['Rosa', 'Benitez', 'Mexico', 'San Luis Potosí'],
      ['David', 'Cortes', 'Colombia', 'Neiva'], ['Carmen', 'Fuentes', 'Chile', 'Rancagua'],
      ['Miguel', 'Parra', 'Mexico', 'Chihuahua'], ['Renata', 'Soto', 'Argentina', 'Neuquén'],
      ['Jorge', 'Salazar', 'Colombia', 'Armenia'],
    ];

    const philippinesNames: [string, string][] = [
      ['Maria Clara', 'Gonzales'], ['Jose', 'Reyes'], ['Christine', 'Bautista'],
      ['Mark', 'Villanueva'], ['Michelle', 'Aquino'], ['Francis', 'Ramos'],
      ['Jasmine', 'Garcia'], ['Kenneth', 'Mendoza'], ['Kathleen', 'Torres'],
      ['Bryan', 'Santos'], ['Angelica', 'Cruz'], ['Patrick', 'Navarro'],
      ['Rachel', 'Flores'], ['Christian', 'Rivera'], ['Nicole', 'Castillo'],
      ['Angelo', 'Mercado'], ['Bianca', 'Soriano'], ['Jerome', 'De Leon'],
      ['Samantha', 'Pascual'], ['Carlo', 'Manalo'], ['Denise', 'Tolentino'],
      ['Ryan', 'Dizon'], ['Monica', 'Salazar'], ['Kevin', 'Aguilar'],
      ['Trisha', 'Panganiban'], ['Aaron', 'Hernandez'], ['Janelle', 'Lorenzo'],
      ['Daniel', 'Fernandez'], ['Grace', 'Concepcion'], ['Benedict', 'Lacson'],
    ];

    const southAfricaNames: [string, string][] = [
      ['Naledi', 'Nkosi'], ['Sipho', 'Dlamini'], ['Zanele', 'Moyo'],
      ['Liam', 'Botha'], ['Amahle', 'Khumalo'], ['Ethan', 'Kruger'],
      ['Lindiwe', 'Ndlovu'], ['Ryan', 'Pretorius'], ['Nomsa', 'Mkhize'],
      ['Dylan', 'Fourie'], ['Palesa', 'Mahlangu'], ['Craig', 'van Wyk'],
      ['Thandiwe', 'Zulu'], ['Jason', 'Erasmus'], ['Lerato', 'Maseko'],
    ];

    const egyptNames: [string, string][] = [
      ['Nour', 'Ibrahim'], ['Omar', 'Mostafa'], ['Mariam', 'Youssef'],
      ['Karim', 'Abdelrahman'], ['Salma', 'Khalil'], ['Youssef', 'Fahmy'],
      ['Hana', 'Samir'], ['Tarek', 'Naguib'], ['Dina', 'Soliman'],
      ['Ali', 'Mansour'], ['Yasmin', 'Badawi'], ['Amr', 'Shafik'],
      ['Layla', 'Tawfik'],
    ];

    const philippinesCities = ['Manila', 'Cebu', 'Davao', 'Quezon City', 'Makati', 'Taguig', 'Pasig', 'Iloilo', 'Bacolod', 'Clark'];
    const southAfricaCities = ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth'];
    const egyptCities = ['Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh', 'Mansoura'];

    const rolePool: string[] = ['administrative', 'customer_support', 'sales', 'lead_generation', 'marketing', 'social_media', 'executive', 'bookkeeping_accounting'];
    const headlinePool: Record<string, string[]> = {
      administrative: ['Administrative Assistant | Inbox & Calendar Expert', 'Virtual Administrative Specialist | Process Optimization', 'Admin Support Professional | Organized & Detail-Oriented', 'Administrative Coordinator | Document & Data Management'],
      customer_support: ['Customer Support Specialist | Live Chat & Email Expert', 'Customer Success Associate | SaaS Support Experience', 'Technical Support Rep | Zendesk & Freshdesk Pro', 'Customer Service Specialist | Bilingual Support'],
      sales: ['Sales Development Rep | B2B SaaS Experience', 'Inside Sales Associate | CRM & Pipeline Expert', 'Business Development Rep | Cold Outreach Specialist'],
      lead_generation: ['Lead Generation Specialist | LinkedIn & Apollo Expert', 'Outbound Prospector | Data-Driven Lead Gen'],
      marketing: ['Digital Marketing Assistant | Email & Social Campaigns', 'Marketing Coordinator | Content & Analytics'],
      social_media: ['Social Media Manager | Content Creation & Scheduling', 'Social Media Coordinator | Instagram & TikTok'],
      executive: ['Executive Assistant | C-Suite Calendar & Travel Support', 'Senior EA | Project Coordination & Ops'],
      bookkeeping_accounting: ['Bookkeeper | QuickBooks & Xero Certified', 'Accounting Assistant | AR/AP & Reconciliation'],
    };
    const skillsPool: Record<string, { name: string; proficiency: string }[]> = {
      administrative: [{ name: 'Calendar Management', proficiency: 'expert' }, { name: 'Email Handling', proficiency: 'advanced' }, { name: 'Data Entry', proficiency: 'expert' }, { name: 'Travel Booking', proficiency: 'advanced' }],
      customer_support: [{ name: 'Zendesk', proficiency: 'expert' }, { name: 'Live Chat', proficiency: 'advanced' }, { name: 'Ticket Management', proficiency: 'expert' }, { name: 'CRM Management', proficiency: 'advanced' }],
      sales: [{ name: 'Cold Calling', proficiency: 'expert' }, { name: 'HubSpot CRM', proficiency: 'advanced' }, { name: 'Pipeline Management', proficiency: 'advanced' }, { name: 'Lead Qualification', proficiency: 'expert' }],
      lead_generation: [{ name: 'Apollo.io', proficiency: 'expert' }, { name: 'LinkedIn Outreach', proficiency: 'advanced' }, { name: 'Cold Email', proficiency: 'advanced' }, { name: 'Data Mining', proficiency: 'expert' }],
      marketing: [{ name: 'Email Marketing', proficiency: 'expert' }, { name: 'Google Analytics', proficiency: 'advanced' }, { name: 'Copywriting', proficiency: 'advanced' }, { name: 'Campaign Analysis', proficiency: 'expert' }],
      social_media: [{ name: 'Content Creation', proficiency: 'expert' }, { name: 'Instagram', proficiency: 'advanced' }, { name: 'Canva', proficiency: 'expert' }, { name: 'Copywriting', proficiency: 'advanced' }],
      executive: [{ name: 'Executive Scheduling', proficiency: 'expert' }, { name: 'Travel Booking', proficiency: 'expert' }, { name: 'Project Management', proficiency: 'advanced' }, { name: 'Stakeholder Communication', proficiency: 'advanced' }],
      bookkeeping_accounting: [{ name: 'QuickBooks', proficiency: 'expert' }, { name: 'Xero', proficiency: 'advanced' }, { name: 'Financial Reporting', proficiency: 'advanced' }, { name: 'Bank Reconciliation', proficiency: 'expert' }],
    };
    const toolsPool: Record<string, string[]> = {
      administrative: ['Google Workspace', 'Slack', 'Notion', 'Asana', 'Calendly', 'Microsoft Office'],
      customer_support: ['Zendesk', 'Intercom', 'Freshdesk', 'Slack', 'HubSpot', 'Loom'],
      sales: ['HubSpot', 'Salesforce', 'LinkedIn Sales Navigator', 'Outreach.io', 'ZoomInfo'],
      lead_generation: ['Apollo.io', 'LinkedIn Sales Navigator', 'Hunter.io', 'Lemlist', 'Google Sheets'],
      marketing: ['Mailchimp', 'HubSpot', 'Google Analytics', 'Facebook Ads Manager', 'Canva'],
      social_media: ['Canva', 'Later', 'Hootsuite', 'Buffer', 'CapCut', 'Adobe Creative Suite'],
      executive: ['Google Workspace', 'Notion', 'Asana', 'Monday.com', 'DocuSign', 'Calendly'],
      bookkeeping_accounting: ['QuickBooks', 'Xero', 'Excel', 'Google Sheets', 'FreshBooks'],
    };
    const bioPool: Record<string, string[]> = {
      administrative: [
        'Organized and proactive administrative professional with experience supporting busy teams and executives. Skilled in calendar management, email triage, data entry, and document preparation. Known for reliability and clear communication.',
        'Efficient virtual assistant with a track record of streamlining office operations for remote teams. Proficient in Google Workspace, Notion, and project management tools. Detail-oriented with excellent follow-through.',
      ],
      customer_support: [
        'Customer-focused support specialist experienced in handling multi-channel inquiries via email, live chat, and phone. Consistently maintain high CSAT scores through empathetic problem-solving and clear communication.',
        'Dedicated support professional with experience in SaaS and e-commerce environments. Strong troubleshooting skills and ability to de-escalate situations while maintaining a positive customer experience.',
      ],
      sales: [
        'Results-oriented sales development representative with experience in B2B lead generation and cold outreach. Skilled at building rapport, qualifying prospects, and managing CRM pipelines to drive revenue growth.',
        'Motivated SDR with a passion for connecting businesses with solutions. Experienced in cold calling, email campaigns, and LinkedIn outreach with proven track record of exceeding quotas.',
      ],
      lead_generation: [
        'Data-driven lead generation specialist experienced in building targeted prospect lists and executing multi-channel outreach campaigns. Proficient in Apollo.io, LinkedIn Sales Navigator, and various enrichment tools.',
        'Strategic prospecting professional who combines research skills with outreach expertise to deliver qualified leads consistently. Strong analytical abilities and attention to data quality.',
      ],
      marketing: [
        'Creative digital marketing professional experienced in email campaigns, social media advertising, and content creation. Data-informed approach to campaign optimization with strong copywriting skills.',
        'Marketing coordinator with hands-on experience managing campaigns across email, social, and paid channels. Skilled at turning analytics into actionable insights that drive growth.',
      ],
      social_media: [
        'Creative social media manager with experience growing brand presence across Instagram, TikTok, and LinkedIn. Skilled in content creation, community management, and performance analytics.',
        'Social media strategist who combines creative content with data-driven decisions. Experienced in managing multiple accounts and creating engaging content calendars.',
      ],
      executive: [
        'Highly organized executive assistant with experience supporting C-level leaders in fast-paced environments. Expert in complex scheduling, travel coordination, and stakeholder communication across time zones.',
        'Reliable EA with strong project management skills and ability to handle confidential matters with discretion. Experienced in board meeting preparation and cross-functional coordination.',
      ],
      bookkeeping_accounting: [
        'Detail-oriented bookkeeper experienced in managing financial records using QuickBooks and Xero. Skilled in invoicing, bank reconciliation, accounts payable/receivable, and monthly reporting.',
        'Accounting professional with experience supporting small businesses with their financial operations. Proficient in cloud accounting software and committed to accuracy and timely reporting.',
      ],
    };

    const additionalTalents = [];
    let talentIndex = 0;
    // Latin America: 45 talents
    for (let i = 0; i < 45; i++) {
      const [firstName, lastName, country, city] = latinAmericaNames[i];
      const tz = country === 'Argentina' ? 'America/Argentina/Buenos_Aires' : country === 'Chile' ? 'America/Santiago' : country === 'Mexico' ? 'America/Mexico_City' : 'America/Bogota';
      const utc = country === 'Argentina' ? -3 : country === 'Chile' ? -3 : country === 'Mexico' ? -6 : -5;
      const role = rolePool[talentIndex % rolePool.length];
      const headlines = headlinePool[role];
      additionalTalents.push({
        firstName, lastName, email: `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}${lastName}`,
        region: 'latin_america', country, city, timezone: tz, utcOffset: utc,
        headline: headlines[talentIndex % headlines.length],
        bio: bioPool[role][talentIndex % bioPool[role].length],
        roleCategories: [role],
        hourlyRate: 6 + Math.floor(Math.random() * 7),
        yearsOfExperience: 2 + Math.floor(Math.random() * 6),
        englishProficiency: (['fluent', 'advanced', 'native'] as const)[Math.floor(Math.random() * 3)],
        availability: Math.random() > 0.35 ? 'full_time' as const : 'part_time' as const,
        isImmediatelyAvailable: Math.random() > 0.6,
        weeklyHours: Math.random() > 0.35 ? 40 : 20,
        skills: skillsPool[role],
        tools: toolsPool[role],
        experience: [{ title: headlines[talentIndex % headlines.length].split(' | ')[0], company: 'Remote Company', startDate: `${2019 + Math.floor(Math.random() * 4)}-0${1 + Math.floor(Math.random() * 9)}`, endDate: null, description: bioPool[role][0].slice(0, 120) + '.' }],
        education: [{ degree: 'Bachelor\'s Degree', institution: `Universidad de ${city}`, year: 2015 + Math.floor(Math.random() * 6) }],
        languages: [{ name: 'Spanish', proficiency: 'native' }, { name: 'English', proficiency: (['fluent', 'advanced'] as const)[Math.floor(Math.random() * 2)] }],
        vettingReport: {
          englishScore: 3.5 + Math.random() * 1.5,
          skillsAssessmentPassed: true, backgroundVerified: true, remoteWorkHistoryConfirmed: true, referenceChecked: true,
          rlRating: Math.random() > 0.5 ? 'Top 5%' : 'Top 10%',
          vettedDate: randomDate(new Date('2023-01-01'), new Date('2024-12-01')),
        },
        status: 'active',
      });
      talentIndex++;
    }
    // Philippines: 30 talents
    for (let i = 0; i < 30; i++) {
      const [firstName, lastName] = philippinesNames[i];
      const city = philippinesCities[i % philippinesCities.length];
      const role = rolePool[talentIndex % rolePool.length];
      const headlines = headlinePool[role];
      additionalTalents.push({
        firstName, lastName, email: `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}${lastName}`,
        region: 'philippines', country: 'Philippines', city, timezone: 'Asia/Manila', utcOffset: 8,
        headline: headlines[talentIndex % headlines.length],
        bio: bioPool[role][talentIndex % bioPool[role].length],
        roleCategories: [role],
        hourlyRate: 6 + Math.floor(Math.random() * 7),
        yearsOfExperience: 2 + Math.floor(Math.random() * 6),
        englishProficiency: (['fluent', 'advanced', 'native'] as const)[Math.floor(Math.random() * 3)],
        availability: Math.random() > 0.35 ? 'full_time' as const : 'part_time' as const,
        isImmediatelyAvailable: Math.random() > 0.6,
        weeklyHours: Math.random() > 0.35 ? 40 : 20,
        skills: skillsPool[role],
        tools: toolsPool[role],
        experience: [{ title: headlines[talentIndex % headlines.length].split(' | ')[0], company: 'Remote Company', startDate: `${2019 + Math.floor(Math.random() * 4)}-0${1 + Math.floor(Math.random() * 9)}`, endDate: null, description: bioPool[role][0].slice(0, 120) + '.' }],
        education: [{ degree: 'Bachelor\'s Degree', institution: `University of ${city}`, year: 2015 + Math.floor(Math.random() * 6) }],
        languages: [{ name: 'English', proficiency: (['fluent', 'native'] as const)[Math.floor(Math.random() * 2)] }, { name: 'Filipino', proficiency: 'native' }],
        vettingReport: {
          englishScore: 3.5 + Math.random() * 1.5,
          skillsAssessmentPassed: true, backgroundVerified: true, remoteWorkHistoryConfirmed: true, referenceChecked: true,
          rlRating: Math.random() > 0.5 ? 'Top 5%' : 'Top 10%',
          vettedDate: randomDate(new Date('2023-01-01'), new Date('2024-12-01')),
        },
        status: 'active',
      });
      talentIndex++;
    }
    // South Africa: 10 talents (indices 75-84 originally, but now we use 15 names for 10)
    for (let i = 0; i < 10; i++) {
      const [firstName, lastName] = southAfricaNames[i];
      const city = southAfricaCities[i % southAfricaCities.length];
      const role = rolePool[talentIndex % rolePool.length];
      const headlines = headlinePool[role];
      additionalTalents.push({
        firstName, lastName, email: `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}${lastName}`,
        region: 'south_africa', country: 'South Africa', city, timezone: 'Africa/Johannesburg', utcOffset: 2,
        headline: headlines[talentIndex % headlines.length],
        bio: bioPool[role][talentIndex % bioPool[role].length],
        roleCategories: [role],
        hourlyRate: 6 + Math.floor(Math.random() * 7),
        yearsOfExperience: 2 + Math.floor(Math.random() * 6),
        englishProficiency: (['fluent', 'advanced', 'native'] as const)[Math.floor(Math.random() * 3)],
        availability: Math.random() > 0.35 ? 'full_time' as const : 'part_time' as const,
        isImmediatelyAvailable: Math.random() > 0.6,
        weeklyHours: Math.random() > 0.35 ? 40 : 20,
        skills: skillsPool[role],
        tools: toolsPool[role],
        experience: [{ title: headlines[talentIndex % headlines.length].split(' | ')[0], company: 'Remote Company', startDate: `${2019 + Math.floor(Math.random() * 4)}-0${1 + Math.floor(Math.random() * 9)}`, endDate: null, description: bioPool[role][0].slice(0, 120) + '.' }],
        education: [{ degree: 'Bachelor\'s Degree', institution: `University of ${city}`, year: 2015 + Math.floor(Math.random() * 6) }],
        languages: [{ name: 'English', proficiency: 'native' }, { name: 'Afrikaans', proficiency: (['fluent', 'native'] as const)[Math.floor(Math.random() * 2)] }],
        vettingReport: {
          englishScore: 4.0 + Math.random(),
          skillsAssessmentPassed: true, backgroundVerified: true, remoteWorkHistoryConfirmed: true, referenceChecked: true,
          rlRating: Math.random() > 0.5 ? 'Top 5%' : 'Top 10%',
          vettedDate: randomDate(new Date('2023-01-01'), new Date('2024-12-01')),
        },
        status: 'active',
      });
      talentIndex++;
    }
    // Egypt: 3 talents (to reach 88 additional = 100 total)
    for (let i = 0; i < 3; i++) {
      const [firstName, lastName] = egyptNames[i];
      const city = egyptCities[i % egyptCities.length];
      const role = rolePool[talentIndex % rolePool.length];
      const headlines = headlinePool[role];
      additionalTalents.push({
        firstName, lastName, email: `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}${lastName}`,
        region: 'egypt', country: 'Egypt', city, timezone: 'Africa/Cairo', utcOffset: 2,
        headline: headlines[talentIndex % headlines.length],
        bio: bioPool[role][talentIndex % bioPool[role].length],
        roleCategories: [role],
        hourlyRate: 6 + Math.floor(Math.random() * 7),
        yearsOfExperience: 2 + Math.floor(Math.random() * 6),
        englishProficiency: (['fluent', 'advanced'] as const)[Math.floor(Math.random() * 2)],
        availability: Math.random() > 0.35 ? 'full_time' as const : 'part_time' as const,
        isImmediatelyAvailable: Math.random() > 0.6,
        weeklyHours: Math.random() > 0.35 ? 40 : 20,
        skills: skillsPool[role],
        tools: toolsPool[role],
        experience: [{ title: headlines[talentIndex % headlines.length].split(' | ')[0], company: 'Remote Company', startDate: `${2019 + Math.floor(Math.random() * 4)}-0${1 + Math.floor(Math.random() * 9)}`, endDate: null, description: bioPool[role][0].slice(0, 120) + '.' }],
        education: [{ degree: 'Bachelor\'s Degree', institution: `University of ${city}`, year: 2015 + Math.floor(Math.random() * 6) }],
        languages: [{ name: 'Arabic', proficiency: 'native' }, { name: 'English', proficiency: (['fluent', 'advanced'] as const)[Math.floor(Math.random() * 2)] }],
        vettingReport: {
          englishScore: 3.5 + Math.random() * 1.5,
          skillsAssessmentPassed: true, backgroundVerified: true, remoteWorkHistoryConfirmed: true, referenceChecked: true,
          rlRating: Math.random() > 0.5 ? 'Top 5%' : 'Top 10%',
          vettedDate: randomDate(new Date('2023-01-01'), new Date('2024-12-01')),
        },
        status: 'active',
      });
      talentIndex++;
    }

    const moreTalents = await Talent.create(additionalTalents);
    console.log(`✅ Created ${talents.length + moreTalents.length} talents`);

    // Create Jobs
    console.log('💼 Creating jobs...');
    const jobs = await Job.create([
      {
        companyId: companies[0]._id,
        title: 'Administrative Assistant',
        roleCategory: 'administrative',
        description: 'We are seeking an experienced administrative assistant to support our executive team with calendar management, email correspondence, and travel coordination.',
        requirements: 'Minimum 3 years experience, excellent English skills, proficiency in Google Workspace',
        hourlyRateMin: 7,
        hourlyRateMax: 10,
        availability: 'full_time',
        status: 'open',
      },
      {
        companyId: companies[0]._id,
        title: 'Sales Development Representative',
        roleCategory: 'sales',
        description: 'Looking for a motivated SDR to generate leads, qualify prospects, and set appointments for our sales team.',
        hourlyRateMin: 8,
        hourlyRateMax: 12,
        availability: 'full_time',
        status: 'open',
      },
      {
        companyId: companies[0]._id,
        title: 'Social Media Manager',
        roleCategory: 'social_media',
        description: 'Part-time social media manager needed to manage our Instagram and LinkedIn presence.',
        hourlyRateMin: 8,
        hourlyRateMax: 11,
        availability: 'part_time',
        status: 'paused',
      },
      {
        companyId: companies[1]._id,
        title: 'Executive Assistant',
        roleCategory: 'executive',
        description: 'High-level executive assistant needed to support our CEO with complex scheduling and strategic projects.',
        hourlyRateMin: 9,
        hourlyRateMax: 14,
        availability: 'full_time',
        status: 'open',
      },
      {
        companyId: companies[1]._id,
        title: 'Customer Support Specialist',
        roleCategory: 'customer_support',
        description: 'Customer-focused support specialist to handle inquiries via email and chat.',
        hourlyRateMin: 6,
        hourlyRateMax: 9,
        availability: 'full_time',
        status: 'open',
      },
    ]);
    console.log(`✅ Created ${jobs.length} jobs`);

    // Create Pipeline Entries for Acme Corp's Admin Assistant job
    console.log('📊 Creating pipeline entries...');

    const allTalents = [...talents, ...moreTalents];
    const adminJob = jobs[0];

    const pipelineEntries = [];

    // 2 shortlisted
    pipelineEntries.push({
      jobId: adminJob._id,
      companyId: companies[0]._id,
      talentId: allTalents[0]._id,
      stage: 'shortlisted',
      stageHistory: [{ from: null, to: 'shortlisted', changedAt: new Date(), changedBy: 'company' }],
      notes: [{ content: 'Strong candidate, good English skills', createdAt: new Date(), stage: 'shortlisted', authorType: 'company', authorId: companies[0]._id }],
    });

    pipelineEntries.push({
      jobId: adminJob._id,
      companyId: companies[0]._id,
      talentId: allTalents[1]._id,
      stage: 'shortlisted',
      stageHistory: [{ from: null, to: 'shortlisted', changedAt: new Date(), changedBy: 'company' }],
      notes: [],
    });

    // 2 in screening
    pipelineEntries.push({
      jobId: adminJob._id,
      companyId: companies[0]._id,
      talentId: allTalents[2]._id,
      stage: 'screening',
      stageHistory: [
        { from: null, to: 'shortlisted', changedAt: new Date('2024-12-01'), changedBy: 'company' },
        { from: 'shortlisted', to: 'screening', changedAt: new Date('2024-12-05'), changedBy: 'company' },
      ],
      screeningTask: {
        title: 'Calendar Management Test',
        description: 'Please complete the attached calendar management scenario',
        dueDate: new Date('2024-12-20'),
        status: 'submitted',
        createdAt: new Date('2024-12-05'),
      },
      notes: [],
    });

    // 1 in interview
    pipelineEntries.push({
      jobId: adminJob._id,
      companyId: companies[0]._id,
      talentId: allTalents[3]._id,
      stage: 'interview',
      stageHistory: [
        { from: null, to: 'shortlisted', changedAt: new Date('2024-11-15'), changedBy: 'company' },
        { from: 'shortlisted', to: 'screening', changedAt: new Date('2024-11-20'), changedBy: 'company' },
        { from: 'screening', to: 'interview', changedAt: new Date('2024-12-01'), changedBy: 'company' },
      ],
      interview: {
        scheduledAt: new Date('2026-04-25T15:00:00Z'),
        candidateTimezone: 'America/Bogota',
        meetingLink: 'https://zoom.us/j/123456789',
        status: 'scheduled',
        notes: 'Video interview to assess communication skills',
      },
      notes: [],
    });

    // 1 in offer
    pipelineEntries.push({
      jobId: adminJob._id,
      companyId: companies[0]._id,
      talentId: allTalents[4]._id,
      stage: 'offer',
      stageHistory: [
        { from: null, to: 'shortlisted', changedAt: new Date('2024-11-01'), changedBy: 'company' },
        { from: 'shortlisted', to: 'screening', changedAt: new Date('2024-11-10'), changedBy: 'company' },
        { from: 'screening', to: 'interview', changedAt: new Date('2024-11-20'), changedBy: 'company' },
        { from: 'interview', to: 'offer', changedAt: new Date('2024-12-01'), changedBy: 'company' },
      ],
      offer: {
        rate: 9,
        hoursPerWeek: 40,
        type: 'full_time',
        startDate: new Date('2025-01-15'),
        message: 'We are excited to offer you this position!',
        status: 'presented',
        sentAt: new Date('2024-12-01'),
      },
      notes: [],
    });

    // 1 in finalizing
    pipelineEntries.push({
      jobId: adminJob._id,
      companyId: companies[0]._id,
      talentId: allTalents[5]._id,
      stage: 'finalizing',
      stageHistory: [
        { from: null, to: 'shortlisted', changedAt: new Date('2024-10-01'), changedBy: 'company' },
        { from: 'shortlisted', to: 'screening', changedAt: new Date('2024-10-10'), changedBy: 'company' },
        { from: 'screening', to: 'interview', changedAt: new Date('2024-10-20'), changedBy: 'company' },
        { from: 'interview', to: 'offer', changedAt: new Date('2024-11-01'), changedBy: 'company' },
        { from: 'offer', to: 'finalizing', changedAt: new Date('2024-11-15'), changedBy: 'admin' },
      ],
      offer: {
        rate: 9,
        hoursPerWeek: 40,
        type: 'full_time',
        startDate: new Date('2025-01-01'),
        message: 'Offer accepted!',
        status: 'accepted',
        sentAt: new Date('2024-11-01'),
        respondedAt: new Date('2024-11-15'),
      },
      finalization: {
        payment: { status: 'paid', amount: 1440, transactionId: 'TXN123', paidAt: new Date('2024-11-20') },
        contract: { status: 'sent', clientSigned: true, candidateSigned: false },
        payroll: { status: 'in_progress', partner: 'Deel' },
        compliance: { status: 'in_progress', countryRequirementsMet: true },
        csm: { status: 'pending' },
        startDate: { status: 'pending' },
      },
      notes: [],
    });

    // 1 hired
    pipelineEntries.push({
      jobId: adminJob._id,
      companyId: companies[0]._id,
      talentId: allTalents[6]._id,
      stage: 'hired',
      stageHistory: [
        { from: null, to: 'shortlisted', changedAt: new Date('2024-09-01'), changedBy: 'company' },
        { from: 'shortlisted', to: 'screening', changedAt: new Date('2024-09-10'), changedBy: 'company' },
        { from: 'screening', to: 'interview', changedAt: new Date('2024-09-20'), changedBy: 'company' },
        { from: 'interview', to: 'offer', changedAt: new Date('2024-10-01'), changedBy: 'company' },
        { from: 'offer', to: 'finalizing', changedAt: new Date('2024-10-15'), changedBy: 'admin' },
        { from: 'finalizing', to: 'hired', changedAt: new Date('2024-11-01'), changedBy: 'admin' },
      ],
      offer: {
        rate: 10,
        hoursPerWeek: 40,
        type: 'full_time',
        startDate: new Date('2024-11-15'),
        message: 'Welcome aboard!',
        status: 'accepted',
        sentAt: new Date('2024-10-01'),
        respondedAt: new Date('2024-10-10'),
      },
      finalization: {
        payment: { status: 'paid', amount: 1600, transactionId: 'TXN456', paidAt: new Date('2024-10-20') },
        contract: { status: 'signed', clientSigned: true, candidateSigned: true, signedAt: new Date('2024-10-25') },
        payroll: { status: 'complete', partner: 'Deel', completedAt: new Date('2024-10-30') },
        compliance: { status: 'verified', countryRequirementsMet: true, verifiedAt: new Date('2024-10-28') },
        csm: { status: 'assigned', name: 'Paula Martinez', email: 'paula@remoteleverage.com', phone: '+1234567890', assignedAt: new Date('2024-10-25') },
        startDate: { status: 'confirmed', confirmedDate: new Date('2024-11-15'), confirmedAt: new Date('2024-10-30') },
      },
      notes: [],
    });

    // 3 rejected
    pipelineEntries.push({
      jobId: adminJob._id,
      companyId: companies[0]._id,
      talentId: allTalents[7]._id,
      stage: 'rejected',
      stageHistory: [
        { from: null, to: 'shortlisted', changedAt: new Date('2024-11-01'), changedBy: 'company' },
        { from: 'shortlisted', to: 'screening', changedAt: new Date('2024-11-10'), changedBy: 'company' },
        { from: 'screening', to: 'rejected', changedAt: new Date('2024-11-20'), changedBy: 'company' },
      ],
      rejection: {
        reason: 'poor_communication',
        notes: 'Did not respond to screening task',
        rejectedAt: new Date('2024-11-20'),
        rejectedAtStage: 'screening',
      },
      notes: [],
    });

    await PipelineEntry.create(pipelineEntries);
    console.log(`✅ Created ${pipelineEntries.length} pipeline entries`);

    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('Company 1: demo@example.com / password123');
    console.log('Company 2: test@example.com / password123');
    console.log('Admin 1: admin@remoteleverage.com / admin123');
    console.log('Admin 2 (CSM): paula@remoteleverage.com / admin123');
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }
};

// Run seeder
const run = async (): Promise<void> => {
  await connectDB();
  await seedDatabase();
  await mongoose.connection.close();
  console.log('👋 Database connection closed');
  process.exit(0);
};

run();

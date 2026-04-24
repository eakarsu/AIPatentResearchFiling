import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'patent_research',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  console.log('🌱 Starting database seed...');

  // Drop and recreate tables
  await pool.query(`
    DROP TABLE IF EXISTS collaboration_items CASCADE;
    DROP TABLE IF EXISTS patent_renewals CASCADE;
    DROP TABLE IF EXISTS landscape_analyses CASCADE;
    DROP TABLE IF EXISTS patent_translations CASCADE;
    DROP TABLE IF EXISTS citation_analyses CASCADE;
    DROP TABLE IF EXISTS patent_filings CASCADE;
    DROP TABLE IF EXISTS competitor_monitoring CASCADE;
    DROP TABLE IF EXISTS patent_portfolios CASCADE;
    DROP TABLE IF EXISTS patent_valuations CASCADE;
    DROP TABLE IF EXISTS infringement_analyses CASCADE;
    DROP TABLE IF EXISTS patent_classifications CASCADE;
    DROP TABLE IF EXISTS patent_claims CASCADE;
    DROP TABLE IF EXISTS patent_drafts CASCADE;
    DROP TABLE IF EXISTS prior_art_analyses CASCADE;
    DROP TABLE IF EXISTS patent_searches CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);

  // Create tables
  await pool.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE patent_searches (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      query TEXT NOT NULL,
      technology_area VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending',
      results_count INTEGER DEFAULT 0,
      description TEXT,
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE prior_art_analyses (
      id SERIAL PRIMARY KEY,
      invention_title VARCHAR(500) NOT NULL,
      invention_description TEXT NOT NULL,
      technology_field VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending',
      novelty_score INTEGER,
      references_found INTEGER DEFAULT 0,
      analysis_result TEXT,
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE patent_drafts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      invention_summary TEXT NOT NULL,
      technical_field VARCHAR(255),
      status VARCHAR(50) DEFAULT 'draft',
      inventors VARCHAR(500),
      abstract TEXT,
      description TEXT,
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE patent_claims (
      id SERIAL PRIMARY KEY,
      patent_title VARCHAR(500) NOT NULL,
      invention_description TEXT NOT NULL,
      claim_type VARCHAR(100),
      num_independent INTEGER DEFAULT 1,
      num_dependent INTEGER DEFAULT 3,
      claims_text TEXT,
      status VARCHAR(50) DEFAULT 'draft',
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE patent_classifications (
      id SERIAL PRIMARY KEY,
      patent_title VARCHAR(500) NOT NULL,
      description TEXT NOT NULL,
      ipc_codes VARCHAR(500),
      cpc_codes VARCHAR(500),
      technology_sector VARCHAR(255),
      confidence_score DECIMAL(3,2),
      status VARCHAR(50) DEFAULT 'pending',
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE infringement_analyses (
      id SERIAL PRIMARY KEY,
      patent_number VARCHAR(100) NOT NULL,
      patent_title VARCHAR(500) NOT NULL,
      accused_product VARCHAR(500) NOT NULL,
      analysis_type VARCHAR(100),
      risk_level VARCHAR(50),
      claim_mapping TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE patent_valuations (
      id SERIAL PRIMARY KEY,
      patent_number VARCHAR(100) NOT NULL,
      patent_title VARCHAR(500) NOT NULL,
      technology_area VARCHAR(255),
      valuation_method VARCHAR(100),
      estimated_value VARCHAR(100),
      market_size VARCHAR(100),
      remaining_life INTEGER,
      status VARCHAR(50) DEFAULT 'pending',
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE patent_portfolios (
      id SERIAL PRIMARY KEY,
      portfolio_name VARCHAR(500) NOT NULL,
      owner VARCHAR(255) NOT NULL,
      total_patents INTEGER DEFAULT 0,
      technology_areas TEXT,
      total_value VARCHAR(100),
      strength_score DECIMAL(3,2),
      status VARCHAR(50) DEFAULT 'active',
      description TEXT,
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE competitor_monitoring (
      id SERIAL PRIMARY KEY,
      competitor_name VARCHAR(255) NOT NULL,
      technology_area VARCHAR(255),
      recent_filings INTEGER DEFAULT 0,
      threat_level VARCHAR(50),
      key_patents TEXT,
      monitoring_status VARCHAR(50) DEFAULT 'active',
      notes TEXT,
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE patent_filings (
      id SERIAL PRIMARY KEY,
      application_title VARCHAR(500) NOT NULL,
      application_number VARCHAR(100),
      filing_date DATE,
      jurisdiction VARCHAR(100) NOT NULL,
      filing_type VARCHAR(100),
      status VARCHAR(50) DEFAULT 'preparing',
      attorney VARCHAR(255),
      estimated_cost VARCHAR(100),
      deadline DATE,
      notes TEXT,
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE citation_analyses (
      id SERIAL PRIMARY KEY,
      patent_number VARCHAR(100) NOT NULL,
      patent_title VARCHAR(500) NOT NULL,
      forward_citations INTEGER DEFAULT 0,
      backward_citations INTEGER DEFAULT 0,
      citation_score DECIMAL(5,2),
      influential_citations TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE patent_translations (
      id SERIAL PRIMARY KEY,
      patent_title VARCHAR(500) NOT NULL,
      source_language VARCHAR(100) NOT NULL,
      target_language VARCHAR(100) NOT NULL,
      original_text TEXT NOT NULL,
      translated_text TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      word_count INTEGER DEFAULT 0,
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE landscape_analyses (
      id SERIAL PRIMARY KEY,
      technology_area VARCHAR(255) NOT NULL,
      scope VARCHAR(255),
      time_period VARCHAR(100),
      total_patents_analyzed INTEGER DEFAULT 0,
      key_players TEXT,
      white_spaces TEXT,
      trends TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE patent_renewals (
      id SERIAL PRIMARY KEY,
      patent_number VARCHAR(100) NOT NULL,
      patent_title VARCHAR(500) NOT NULL,
      jurisdiction VARCHAR(100),
      renewal_date DATE,
      renewal_fee VARCHAR(100),
      status VARCHAR(50) DEFAULT 'upcoming',
      priority VARCHAR(50) DEFAULT 'medium',
      auto_renew BOOLEAN DEFAULT false,
      notes TEXT,
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE collaboration_items (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      assigned_to VARCHAR(255),
      task_type VARCHAR(100),
      priority VARCHAR(50) DEFAULT 'medium',
      status VARCHAR(50) DEFAULT 'open',
      due_date DATE,
      patent_reference VARCHAR(255),
      comments TEXT,
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Seed users
  const hashedPassword = await bcrypt.hash('password123', 10);
  await pool.query(`
    INSERT INTO users (email, password, name) VALUES
    ('admin@patentai.com', $1, 'Admin User'),
    ('john@patentai.com', $1, 'John Smith'),
    ('sarah@patentai.com', $1, 'Sarah Johnson')
  `, [hashedPassword]);

  // Seed patent_searches (15 items)
  await pool.query(`
    INSERT INTO patent_searches (title, query, technology_area, status, results_count, description) VALUES
    ('AI-Powered Drug Discovery Methods', 'artificial intelligence drug discovery machine learning pharmaceutical', 'Biotechnology', 'completed', 342, 'Comprehensive search for AI/ML methods applied to pharmaceutical drug discovery and development'),
    ('Autonomous Vehicle Navigation Systems', 'self-driving car navigation lidar sensor fusion autonomous', 'Automotive', 'completed', 256, 'Search for patents related to autonomous vehicle navigation and sensor fusion technologies'),
    ('Quantum Computing Error Correction', 'quantum computing error correction qubit fault tolerant', 'Computing', 'completed', 189, 'Patents covering quantum error correction codes and fault-tolerant quantum computing'),
    ('CRISPR Gene Editing Therapeutics', 'CRISPR Cas9 gene editing therapy genetic modification', 'Biotechnology', 'in_progress', 478, 'Gene editing therapeutic applications using CRISPR-Cas9 technology'),
    ('5G Network Slicing Architecture', '5G network slicing virtualization NFV SDN mobile', 'Telecommunications', 'completed', 312, 'Network slicing implementations for 5G telecommunications infrastructure'),
    ('Solid-State Battery Technology', 'solid state battery lithium electrolyte energy storage', 'Energy', 'completed', 267, 'Solid-state battery designs and manufacturing processes'),
    ('Brain-Computer Interface Devices', 'brain computer interface neural implant EEG BCI', 'Medical Devices', 'in_progress', 198, 'Neural interface devices for direct brain-computer communication'),
    ('Carbon Capture and Storage', 'carbon capture storage sequestration CO2 climate', 'Environmental', 'completed', 445, 'Technologies for capturing and storing atmospheric carbon dioxide'),
    ('Blockchain Smart Contract Platforms', 'blockchain smart contract decentralized ledger ethereum', 'Software', 'completed', 523, 'Smart contract platforms and decentralized application frameworks'),
    ('Advanced Robotics Manipulation', 'robotic manipulation gripper dexterous assembly automation', 'Robotics', 'in_progress', 234, 'Robotic manipulation systems with advanced gripper designs'),
    ('mRNA Vaccine Platform Technology', 'mRNA vaccine lipid nanoparticle delivery immunotherapy', 'Pharmaceuticals', 'completed', 367, 'mRNA-based vaccine platforms and lipid nanoparticle delivery systems'),
    ('Edge Computing IoT Architecture', 'edge computing IoT fog computing distributed processing', 'Computing', 'completed', 289, 'Edge computing architectures for Internet of Things applications'),
    ('Perovskite Solar Cell Designs', 'perovskite solar cell photovoltaic tandem efficiency', 'Energy', 'in_progress', 178, 'Perovskite-based solar cell designs and manufacturing methods'),
    ('Natural Language Processing Models', 'NLP transformer language model attention mechanism BERT GPT', 'AI/ML', 'completed', 612, 'Large language model architectures and training methodologies'),
    ('Augmented Reality Display Systems', 'augmented reality AR display waveguide holographic HMD', 'Consumer Electronics', 'completed', 345, 'AR display technologies including waveguides and holographic elements')
  `);

  // Seed prior_art_analyses (15 items)
  await pool.query(`
    INSERT INTO prior_art_analyses (invention_title, invention_description, technology_field, status, novelty_score, references_found, analysis_result) VALUES
    ('Adaptive AI Training Scheduler', 'A system that dynamically adjusts neural network training schedules based on real-time loss metrics', 'Machine Learning', 'completed', 78, 12, 'Moderate novelty. Several references found for adaptive learning rates but the specific combination with real-time loss-based scheduling shows novelty.'),
    ('Biodegradable Electronics Substrate', 'Fully biodegradable circuit board made from cellulose nanofibers', 'Materials Science', 'completed', 92, 4, 'High novelty. Limited prior art in biodegradable electronics substrates using cellulose nanofibers.'),
    ('Quantum-Safe Encryption Protocol', 'Post-quantum cryptographic protocol using lattice-based encryption for IoT devices', 'Cybersecurity', 'completed', 65, 23, 'Moderate novelty. Lattice-based cryptography is well-known but IoT-specific implementation shows some novelty.'),
    ('Personalized Microbiome Therapy', 'AI-driven system for creating personalized probiotic treatments based on gut microbiome analysis', 'Healthcare', 'in_progress', 85, 8, 'Good novelty. AI-driven personalization of microbiome therapy is relatively unexplored.'),
    ('Self-Healing Concrete Composition', 'Concrete mixture containing bacterial spores that activate upon crack formation', 'Construction', 'completed', 45, 34, 'Low novelty. Extensive prior art exists for bacterial self-healing concrete.'),
    ('Emotion-Aware Voice Assistant', 'Voice assistant that detects and responds to user emotional states in real-time', 'AI/HCI', 'completed', 72, 15, 'Moderate-high novelty. Emotion detection exists but integrated real-time response adaptation is novel.'),
    ('Wireless Power Transfer for EVs', 'Dynamic wireless charging system for electric vehicles while driving', 'Automotive', 'in_progress', 55, 28, 'Moderate novelty. Many prior art references but specific dynamic charging approach differs.'),
    ('DNA Data Storage Encoder', 'Efficient encoding algorithm for storing digital data in synthetic DNA sequences', 'Biotechnology', 'completed', 81, 9, 'Good novelty. Specific encoding optimization for DNA storage efficiency is relatively new.'),
    ('Haptic Feedback Surgical Glove', 'Surgical glove with integrated haptic sensors providing force feedback during minimally invasive surgery', 'Medical Devices', 'completed', 88, 6, 'High novelty. Integrated haptic feedback in surgical gloves with force sensing is novel.'),
    ('Atmospheric Water Harvester', 'Solar-powered device for extracting water from atmospheric humidity in arid regions', 'Environmental', 'completed', 58, 21, 'Moderate novelty. Solar-powered water harvesting exists but specific efficiency improvements are novel.'),
    ('Federated Learning Privacy Framework', 'Privacy-preserving federated learning framework with differential privacy guarantees', 'AI/ML', 'in_progress', 68, 18, 'Moderate novelty. Combination of federated learning with formal differential privacy guarantees shows some novelty.'),
    ('Graphene-Enhanced Battery Anode', 'Lithium-ion battery anode using graphene-silicon composite for increased capacity', 'Energy Storage', 'completed', 42, 38, 'Low novelty. Graphene-silicon anodes are extensively researched with many prior art references.'),
    ('Smart Traffic Flow Optimizer', 'AI system that optimizes city-wide traffic flow using real-time data from connected vehicles', 'Transportation', 'completed', 61, 19, 'Moderate novelty. Traffic optimization using connected vehicle data has growing prior art.'),
    ('Acoustic Metamaterial Noise Barrier', 'Engineered metamaterial structure for selective sound frequency cancellation', 'Acoustics', 'completed', 76, 11, 'Good novelty. Selective frequency cancellation using metamaterials shows clear differentiation.'),
    ('Neural Architecture Search Accelerator', 'Hardware accelerator specifically designed for neural architecture search optimization', 'Computing', 'in_progress', 83, 7, 'Good novelty. Dedicated hardware for NAS is a relatively unexplored area.')
  `);

  // Seed patent_drafts (15 items)
  await pool.query(`
    INSERT INTO patent_drafts (title, invention_summary, technical_field, status, inventors, abstract) VALUES
    ('Adaptive Neural Network Training System', 'A system and method for dynamically adjusting training parameters of neural networks based on real-time performance metrics', 'Computer Science', 'draft', 'Dr. James Wilson, Dr. Maria Chen', 'An adaptive training system that monitors neural network performance in real-time and automatically adjusts learning rates, batch sizes, and regularization parameters to optimize convergence speed and model accuracy.'),
    ('Biodegradable Electronic Circuit Board', 'A fully biodegradable printed circuit board substrate made from cellulose nanofiber composite materials', 'Materials Engineering', 'review', 'Dr. Emily Park, Robert Zhang', 'A circuit board substrate comprising cellulose nanofibers combined with conductive bio-inks, providing full biodegradability while maintaining electrical performance comparable to conventional FR-4 substrates.'),
    ('Quantum-Resistant IoT Security Protocol', 'A lightweight post-quantum cryptographic protocol specifically designed for resource-constrained IoT devices', 'Cybersecurity', 'draft', 'Dr. Alex Novak, Dr. Sarah Kim', 'A cryptographic protocol utilizing lattice-based encryption optimized for IoT devices with limited computational resources, providing quantum-resistant security with minimal power consumption.'),
    ('AI-Driven Microbiome Treatment System', 'An artificial intelligence system for analyzing gut microbiome data and generating personalized probiotic treatment plans', 'Biotechnology', 'filed', 'Dr. Lisa Thompson, Dr. Michael Brown', 'A system employing machine learning algorithms to analyze individual microbiome profiles and generate personalized probiotic formulations optimized for specific health outcomes.'),
    ('Smart Concrete with Self-Healing Properties', 'A concrete composition incorporating encapsulated bacterial spores that activate upon crack formation to produce calcium carbonate', 'Civil Engineering', 'draft', 'Dr. Hans Mueller, Dr. Yuki Tanaka', 'A self-healing concrete composition containing microencapsulated bacteria that germinate when exposed to water ingress through cracks, producing calcium carbonate to seal the cracks autonomously.'),
    ('Emotion-Responsive AI Assistant Platform', 'A multi-modal AI platform that detects user emotional states through voice, facial, and physiological signals', 'Human-Computer Interaction', 'review', 'Dr. Rachel Green, David Lee', 'An AI assistant platform that integrates voice analysis, facial recognition, and physiological sensors to detect emotional states and adapt responses accordingly for enhanced user experience.'),
    ('Dynamic Wireless EV Charging System', 'A system for wirelessly charging electric vehicles while in motion using embedded road coils', 'Electrical Engineering', 'draft', 'Dr. Carlos Rivera, Dr. Anna Schmidt', 'A dynamic wireless power transfer system using resonant inductive coupling through coils embedded in road surfaces, enabling continuous charging of electric vehicles during normal driving operations.'),
    ('High-Density DNA Digital Storage System', 'An optimized encoding system for storing and retrieving digital information using synthetic DNA molecules', 'Bioengineering', 'filed', 'Dr. Kevin Wu, Dr. Patricia Davis', 'A DNA-based digital storage system featuring a novel error-correcting encoding scheme that achieves unprecedented data density while maintaining reliable retrieval through targeted PCR amplification.'),
    ('Haptic Surgical Interface System', 'A surgical glove system with integrated pressure sensors and haptic actuators for minimally invasive procedures', 'Medical Technology', 'draft', 'Dr. Robert Chen, Dr. Susan Miller', 'A surgical interface comprising a smart glove with distributed force sensors and vibrotactile actuators providing real-time haptic feedback during robotic and minimally invasive surgical procedures.'),
    ('Solar Atmospheric Water Generator', 'An energy-efficient device that harvests potable water from atmospheric humidity using solar energy', 'Environmental Engineering', 'review', 'Dr. Ahmed Hassan, Dr. Jennifer White', 'A water harvesting device using solar-powered thermoelectric cooling and hydrophilic surfaces to condense atmospheric moisture into potable water, optimized for deployment in arid regions.'),
    ('Privacy-Preserving Federated AI System', 'A distributed machine learning framework ensuring data privacy through homomorphic encryption', 'AI/Privacy', 'draft', 'Dr. Thomas Anderson, Dr. Nina Patel', 'A federated learning system incorporating homomorphic encryption and secure aggregation protocols to enable collaborative model training across organizations without exposing raw training data.'),
    ('High-Capacity Graphene Battery Electrode', 'A lithium-ion battery electrode using vertically aligned graphene-silicon nanostructures', 'Energy Technology', 'draft', 'Dr. Wei Zhang, Dr. Maria Gonzalez', 'A battery electrode comprising vertically aligned graphene sheets decorated with silicon nanoparticles, providing high lithium-ion capacity with improved cycling stability through mechanical strain accommodation.'),
    ('AI Urban Traffic Management Platform', 'An intelligent traffic management system using connected vehicle data and predictive AI', 'Transportation', 'review', 'Dr. James Park, Dr. Linda Chang', 'A city-wide traffic management platform that aggregates real-time data from connected vehicles, traffic sensors, and predictive AI models to dynamically optimize signal timing and route recommendations.'),
    ('Acoustic Metamaterial Sound Barrier', 'An engineered metamaterial panel for selective acoustic frequency filtering', 'Acoustics Engineering', 'filed', 'Dr. Sophie Martin, Dr. Oliver Wright', 'An acoustic barrier comprising metamaterial unit cells designed to selectively attenuate specific frequency bands while remaining transparent to others, enabling targeted noise control applications.'),
    ('Neural Architecture Search Hardware', 'A dedicated hardware accelerator optimized for automated neural architecture search', 'Computer Architecture', 'draft', 'Dr. Raj Patel, Dr. Emma Johnson', 'A specialized processor architecture designed to accelerate neural architecture search operations through parallel evaluation of candidate architectures and hardware-aware optimization of network topologies.')
  `);

  // Seed patent_claims (15 items)
  await pool.query(`
    INSERT INTO patent_claims (patent_title, invention_description, claim_type, num_independent, num_dependent, claims_text, status) VALUES
    ('Adaptive Neural Network Trainer', 'Dynamic training parameter adjustment system', 'Method', 3, 12, 'Claim 1: A method for adaptively training a neural network comprising: monitoring real-time loss metrics; computing gradient statistics; dynamically adjusting learning rate based on said statistics.', 'draft'),
    ('Biodegradable PCB Substrate', 'Cellulose nanofiber circuit board', 'Composition', 2, 8, 'Claim 1: A biodegradable circuit board substrate comprising: a cellulose nanofiber matrix; conductive pathways formed from bio-compatible conductive ink; a biodegradable protective coating.', 'review'),
    ('Post-Quantum IoT Protocol', 'Lightweight quantum-safe encryption', 'System', 2, 10, 'Claim 1: A system for secure IoT communication comprising: a lattice-based key generation module; a lightweight encryption engine; a resource-adaptive security parameter selector.', 'draft'),
    ('Microbiome Analysis Platform', 'AI-driven gut health analysis', 'Method', 3, 9, 'Claim 1: A method for personalized microbiome therapy comprising: sequencing a gut microbiome sample; applying a trained ML model to the sequence data; generating a personalized probiotic formulation.', 'approved'),
    ('Self-Healing Concrete Mix', 'Bacterial concrete repair system', 'Composition', 2, 6, 'Claim 1: A concrete composition comprising: a cementitious matrix; microencapsulated bacterial spores of genus Bacillus; a calcium lactate nutrient source.', 'draft'),
    ('Emotion Detection AI System', 'Multi-modal emotion recognition', 'System', 3, 11, 'Claim 1: An emotion-aware computing system comprising: a voice analysis module; a facial expression recognition module; a fusion engine for combining multi-modal emotion signals; an adaptive response generator.', 'review'),
    ('Dynamic Wireless EV Charger', 'Moving vehicle wireless charging', 'Apparatus', 2, 8, 'Claim 1: An apparatus for dynamic wireless charging comprising: a series of resonant inductive coils embedded in a road surface; a vehicle-mounted receiving coil; a power management controller.', 'draft'),
    ('DNA Storage Encoder', 'Digital-to-DNA encoding system', 'Method', 2, 7, 'Claim 1: A method for encoding digital data in DNA comprising: converting binary data to nucleotide sequences; applying error correction encoding; synthesizing DNA oligonucleotides representing the encoded data.', 'approved'),
    ('Haptic Surgical Glove', 'Force-feedback surgical interface', 'Apparatus', 3, 10, 'Claim 1: A haptic surgical apparatus comprising: a flexible glove substrate; distributed pressure sensors on fingertip regions; vibrotactile actuators; a signal processing unit for generating haptic feedback.', 'draft'),
    ('Solar Water Harvester', 'Atmospheric moisture collection device', 'Apparatus', 2, 8, 'Claim 1: An apparatus for harvesting atmospheric water comprising: a solar-powered thermoelectric cooling element; a hydrophilic condensation surface; a water collection and filtration system.', 'review'),
    ('Federated Learning Framework', 'Privacy-preserving distributed ML', 'System', 3, 12, 'Claim 1: A federated learning system comprising: distributed training nodes; a secure aggregation server; homomorphic encryption modules; a differential privacy noise generator.', 'draft'),
    ('Graphene-Si Battery Electrode', 'High-capacity battery anode', 'Composition', 2, 7, 'Claim 1: A battery electrode comprising: a current collector substrate; vertically aligned graphene sheets; silicon nanoparticles deposited on graphene surfaces; a conductive binder matrix.', 'draft'),
    ('AI Traffic Management System', 'Connected vehicle traffic optimization', 'System', 3, 9, 'Claim 1: A traffic management system comprising: a connected vehicle data aggregation module; a real-time traffic prediction engine; a dynamic signal timing optimizer; a route recommendation generator.', 'approved'),
    ('Acoustic Metamaterial Panel', 'Frequency-selective sound barrier', 'Apparatus', 2, 8, 'Claim 1: An acoustic barrier apparatus comprising: an array of metamaterial unit cells; each unit cell having a resonant cavity tuned to a target frequency; a mounting frame for modular assembly.', 'review'),
    ('NAS Hardware Accelerator', 'Neural architecture search processor', 'Apparatus', 3, 11, 'Claim 1: A hardware accelerator for neural architecture search comprising: a parallel architecture evaluation engine; a hardware-aware fitness estimator; a search space exploration controller.', 'draft')
  `);

  // Seed patent_classifications (15 items)
  await pool.query(`
    INSERT INTO patent_classifications (patent_title, description, ipc_codes, cpc_codes, technology_sector, confidence_score, status) VALUES
    ('AI Drug Discovery Platform', 'Machine learning system for identifying drug candidates through molecular simulation', 'G16H50/20, G06N3/08', 'G16H50/20, G06N3/084, C12Q1/6886', 'Biotechnology/AI', 0.94, 'classified'),
    ('LiDAR Navigation System', 'Multi-beam LiDAR system for autonomous vehicle obstacle detection', 'G01S17/93, B60W30/00', 'G01S17/931, B60W30/095, G05D1/0246', 'Automotive', 0.97, 'classified'),
    ('Quantum Error Correction Code', 'Topological quantum error correction using surface codes', 'G06N10/70, H03M13/00', 'G06N10/70, H03M13/2957, G06F11/1076', 'Quantum Computing', 0.91, 'classified'),
    ('CRISPR Delivery Vector', 'Lipid nanoparticle delivery system for CRISPR-Cas9 gene editing', 'C12N15/87, A61K48/00', 'C12N15/87, A61K48/0066, C12N9/22', 'Gene Therapy', 0.96, 'classified'),
    ('5G Beamforming Antenna', 'Massive MIMO antenna array with adaptive beamforming', 'H04B7/0456, H01Q3/26', 'H04B7/0456, H01Q3/2605, H04W16/28', 'Telecommunications', 0.93, 'classified'),
    ('Solid-State Electrolyte', 'Garnet-type solid electrolyte for lithium batteries', 'H01M10/0562, C01G25/00', 'H01M10/0562, C01G25/006, H01M2300/0068', 'Energy Storage', 0.95, 'classified'),
    ('Neural Implant Interface', 'High-density neural recording electrode array', 'A61N1/0551, A61B5/25', 'A61N1/0551, A61B5/2507, H01L27/146', 'Medical Devices', 0.92, 'classified'),
    ('CO2 Capture Membrane', 'Polymeric membrane for selective CO2 separation from flue gas', 'B01D53/22, B01D71/02', 'B01D53/228, B01D71/022, B01D2257/504', 'Environmental', 0.90, 'classified'),
    ('DeFi Protocol Engine', 'Decentralized finance protocol with automated market making', 'G06Q20/06, H04L9/00', 'G06Q20/0658, H04L9/3247, G06Q40/04', 'Fintech', 0.88, 'classified'),
    ('Soft Robotic Gripper', 'Pneumatic soft actuator gripper with embedded sensing', 'B25J15/12, B25J9/14', 'B25J15/12, B25J9/144, B25J13/084', 'Robotics', 0.94, 'classified'),
    ('mRNA Lipid Formulation', 'Ionizable lipid nanoparticle for mRNA vaccine delivery', 'A61K9/127, A61K31/7088', 'A61K9/127, A61K31/7088, A61K39/12', 'Pharmaceuticals', 0.96, 'classified'),
    ('Edge AI Inference Chip', 'Low-power neural network inference accelerator for edge devices', 'G06N3/063, G06F15/78', 'G06N3/063, G06F15/7867, G06F1/3234', 'Semiconductors', 0.93, 'classified'),
    ('Perovskite Tandem Cell', 'Perovskite-silicon tandem solar cell with tunnel junction', 'H01L31/078, H01L31/0687', 'H01L31/078, H01L31/0687, H02S40/44', 'Solar Energy', 0.91, 'classified'),
    ('Transformer Architecture', 'Multi-head attention mechanism for sequence-to-sequence tasks', 'G06N3/044, G10L15/16', 'G06N3/044, G10L15/16, G06F40/284', 'AI/NLP', 0.95, 'classified'),
    ('Waveguide AR Display', 'Diffractive waveguide display for augmented reality glasses', 'G02B27/01, G02B6/34', 'G02B27/0172, G02B6/34, G02B5/1814', 'Consumer Electronics', 0.92, 'classified')
  `);

  // Seed infringement_analyses (15 items)
  await pool.query(`
    INSERT INTO infringement_analyses (patent_number, patent_title, accused_product, analysis_type, risk_level, claim_mapping, status) VALUES
    ('US10,234,567', 'Machine Learning Model Compression', 'CompactAI Model Optimizer', 'Literal', 'high', 'Claims 1,3,7 potentially infringed - model pruning and quantization steps match', 'completed'),
    ('US10,345,678', 'Wireless Charging Pad Design', 'PowerWave Ultra Charger', 'Equivalents', 'medium', 'Claim 1 - coil arrangement differs but may be equivalent; Claims 4-6 not infringed', 'completed'),
    ('US10,456,789', 'Voice Authentication System', 'SecureVoice ID Platform', 'Literal', 'high', 'Claims 1-3 appear directly infringed - voiceprint extraction and matching identical', 'in_progress'),
    ('US10,567,890', 'Drone Delivery Navigation', 'SkyDrop Delivery Service', 'Combined', 'critical', 'Claims 1,2,5,8 literally infringed; Claims 3,4 infringed under doctrine of equivalents', 'completed'),
    ('US10,678,901', 'Blockchain Consensus Mechanism', 'ChainFast Protocol v2', 'Literal', 'low', 'Claims reviewed - consensus mechanism uses fundamentally different approach', 'completed'),
    ('US10,789,012', 'Image Recognition Algorithm', 'VisionPro Analytics Suite', 'Combined', 'medium', 'Claim 1 architecture similar; Claims 5-8 training method differs significantly', 'in_progress'),
    ('US10,890,123', 'Battery Management System', 'EnergyMax BMS Controller', 'Literal', 'high', 'Claims 1-4 cell balancing method directly infringed; Claim 7 thermal management matches', 'completed'),
    ('US10,901,234', 'Natural Language Query Engine', 'SmartQuery Enterprise', 'Equivalents', 'medium', 'Claim 1 query parsing equivalent; Claims 3-5 result ranking uses different technique', 'completed'),
    ('US11,012,345', 'Robotic Surgery Controller', 'MediBot Surgical System', 'Combined', 'critical', 'Claims 1-6 haptic feedback and motion scaling directly match patent specifications', 'in_progress'),
    ('US11,123,456', 'Smart Grid Load Balancer', 'GridOptima Platform', 'Literal', 'low', 'Claims analyzed - load prediction method substantially different from patented approach', 'completed'),
    ('US11,234,567', 'Facial Recognition Privacy System', 'PrivacyShield Camera', 'Literal', 'medium', 'Claim 1 face detection similar; Claims 3-4 anonymization technique differs', 'completed'),
    ('US11,345,678', 'Autonomous Parking System', 'AutoPark Pro System', 'Combined', 'high', 'Claims 1-3 sensor fusion literally infringed; Claim 5 path planning equivalent', 'in_progress'),
    ('US11,456,789', 'Cloud Resource Optimizer', 'CloudScale Autoscaler', 'Literal', 'low', 'Claims reviewed - resource allocation algorithm uses different optimization strategy', 'completed'),
    ('US11,567,890', 'Wearable Health Monitor', 'HealthBand Pro Tracker', 'Equivalents', 'medium', 'Claim 1 sensor array equivalent; Claims 4-6 data processing pipeline differs', 'completed'),
    ('US11,678,901', 'Supply Chain Tracking System', 'TraceLink Blockchain', 'Combined', 'high', 'Claims 1,2,4 tracking methodology infringed; Claims 7-9 blockchain implementation matches', 'completed')
  `);

  // Seed patent_valuations (15 items)
  await pool.query(`
    INSERT INTO patent_valuations (patent_number, patent_title, technology_area, valuation_method, estimated_value, market_size, remaining_life, status) VALUES
    ('US10,234,567', 'AI Model Compression Technology', 'Artificial Intelligence', 'Income', '$12.5M - $18.2M', '$4.2B', 14, 'completed'),
    ('US10,345,678', 'Next-Gen Wireless Charging', 'Consumer Electronics', 'Market', '$8.3M - $11.7M', '$15.8B', 12, 'completed'),
    ('US10,456,789', 'Biometric Voice Authentication', 'Cybersecurity', 'Income', '$15.8M - $22.1M', '$3.9B', 16, 'completed'),
    ('US10,567,890', 'Autonomous Drone Navigation', 'Aerospace', 'Cost', '$5.2M - $7.8M', '$28.5B', 13, 'in_progress'),
    ('US10,678,901', 'Novel Consensus Protocol', 'Blockchain', 'Market', '$3.1M - $5.4M', '$11.2B', 15, 'completed'),
    ('US10,789,012', 'Medical Image Analysis AI', 'Healthcare IT', 'Income', '$22.4M - $31.6M', '$7.8B', 17, 'completed'),
    ('US10,890,123', 'Advanced Battery Management', 'Energy Storage', 'Market', '$9.7M - $14.3M', '$22.1B', 11, 'completed'),
    ('US10,901,234', 'Semantic Search Engine', 'Enterprise Software', 'Income', '$7.6M - $10.9M', '$5.6B', 14, 'in_progress'),
    ('US11,012,345', 'Surgical Robotics Control', 'Medical Devices', 'Income', '$35.2M - $48.7M', '$8.4B', 18, 'completed'),
    ('US11,123,456', 'Smart Grid Optimization', 'Energy', 'Cost', '$6.3M - $9.1M', '$31.7B', 15, 'completed'),
    ('US11,234,567', 'Privacy-Preserving AI', 'Data Privacy', 'Market', '$11.2M - $16.8M', '$6.3B', 16, 'completed'),
    ('US11,345,678', 'Autonomous Parking Tech', 'Automotive', 'Income', '$18.9M - $25.4M', '$19.2B', 14, 'in_progress'),
    ('US11,456,789', 'Cloud Auto-Scaling System', 'Cloud Computing', 'Market', '$4.8M - $7.2M', '$42.3B', 13, 'completed'),
    ('US11,567,890', 'Wearable Biosensor Array', 'Wearable Tech', 'Income', '$13.6M - $19.4M', '$12.7B', 17, 'completed'),
    ('US11,678,901', 'Blockchain Supply Chain', 'Logistics', 'Cost', '$8.9M - $12.1M', '$9.8B', 15, 'completed')
  `);

  // Seed patent_portfolios (15 items)
  await pool.query(`
    INSERT INTO patent_portfolios (portfolio_name, owner, total_patents, technology_areas, total_value, strength_score, status, description) VALUES
    ('AI & Machine Learning Portfolio', 'TechVision Corp', 156, 'Deep Learning, NLP, Computer Vision, Reinforcement Learning', '$245M', 0.92, 'active', 'Comprehensive AI patent portfolio covering major ML paradigms and applications'),
    ('Autonomous Vehicles Suite', 'DriveAI Inc', 89, 'ADAS, LiDAR, Sensor Fusion, Path Planning', '$178M', 0.88, 'active', 'Full-stack autonomous driving technology patent portfolio'),
    ('5G/6G Communications', 'WaveConnect Labs', 234, 'mmWave, Beamforming, Network Slicing, MIMO', '$412M', 0.95, 'active', 'Essential patents for next-generation wireless communications'),
    ('Quantum Computing IP', 'QuantumLeap Technologies', 67, 'Qubits, Error Correction, Quantum Algorithms, Cryogenics', '$89M', 0.78, 'active', 'Growing quantum computing patent portfolio with key foundational patents'),
    ('Biotech Therapeutics', 'GeneCure Pharma', 312, 'Gene Therapy, mRNA, Antibodies, Drug Delivery', '$567M', 0.96, 'active', 'Extensive biotech patent portfolio covering multiple therapeutic modalities'),
    ('Clean Energy Technologies', 'GreenPower Inc', 178, 'Solar, Wind, Battery Storage, Smart Grid', '$223M', 0.85, 'active', 'Renewable energy and storage technology patent portfolio'),
    ('Robotics & Automation', 'RoboWorks Ltd', 98, 'Industrial Robots, Soft Robotics, Manipulation, Navigation', '$134M', 0.82, 'active', 'Advanced robotics patent portfolio for industrial and service applications'),
    ('Cybersecurity Solutions', 'SecureNet Corp', 145, 'Encryption, Authentication, Network Security, Privacy', '$198M', 0.89, 'active', 'Comprehensive cybersecurity patent portfolio with strong defensive value'),
    ('Digital Health Platform', 'HealthTech Innovations', 123, 'Wearables, Telemedicine, EHR, Diagnostics AI', '$167M', 0.84, 'active', 'Digital health technology patents spanning devices to cloud analytics'),
    ('Semiconductor Process IP', 'ChipForge Inc', 267, 'EUV Lithography, 3D Packaging, FinFET, GAA', '$678M', 0.97, 'active', 'Critical semiconductor manufacturing process patents'),
    ('AR/VR Display Technologies', 'ImmersiveView Inc', 76, 'Waveguides, Holographic, Micro-LED, Eye Tracking', '$98M', 0.79, 'active', 'Augmented and virtual reality display technology patents'),
    ('Blockchain & DeFi', 'ChainCore Technologies', 54, 'Smart Contracts, Consensus, DeFi Protocols, NFT', '$67M', 0.73, 'active', 'Blockchain infrastructure and decentralized finance patent portfolio'),
    ('Edge Computing & IoT', 'EdgeSphere Inc', 112, 'Edge AI, IoT Protocols, Fog Computing, Sensor Networks', '$145M', 0.86, 'active', 'Edge computing and IoT infrastructure patent portfolio'),
    ('Advanced Materials', 'NanoMat Research', 189, 'Graphene, Metamaterials, Composites, Smart Materials', '$234M', 0.91, 'active', 'Advanced materials and nanotechnology patent portfolio'),
    ('Space Technology', 'OrbitalTech Corp', 43, 'Satellite Communications, Propulsion, Space Manufacturing', '$78M', 0.76, 'growing', 'Emerging space technology patent portfolio with strategic filings')
  `);

  // Seed competitor_monitoring (15 items)
  await pool.query(`
    INSERT INTO competitor_monitoring (competitor_name, technology_area, recent_filings, threat_level, key_patents, monitoring_status, notes) VALUES
    ('Google DeepMind', 'Artificial Intelligence', 487, 'high', 'US11,234,567 (AlphaFold), US11,345,678 (Gemini Architecture)', 'active', 'Aggressive AI patent filing strategy. Key areas: protein folding, multimodal AI, reinforcement learning.'),
    ('Tesla Inc', 'Electric Vehicles', 312, 'critical', 'US11,456,789 (FSD Chip), US11,567,890 (Battery Cell Design)', 'active', 'Dominant EV patent filer. Expanding into energy storage and AI/robotics.'),
    ('Samsung Electronics', 'Semiconductors', 1245, 'high', 'US11,678,901 (3nm GAA), US11,789,012 (HBM4 Memory)', 'active', 'Massive filing volume across multiple technology areas. Key focus on advanced nodes and memory.'),
    ('Moderna Inc', 'mRNA Therapeutics', 234, 'medium', 'US11,890,123 (LNP Formulation), US11,901,234 (mRNA Optimization)', 'active', 'Expanding mRNA platform beyond vaccines into rare diseases and oncology.'),
    ('Apple Inc', 'Consumer Electronics', 567, 'high', 'US12,012,345 (Vision Pro Optics), US12,123,456 (Neural Engine)', 'active', 'Focus on AR/VR, health sensors, and custom silicon. Strong design patent portfolio.'),
    ('Microsoft Research', 'Cloud & AI', 678, 'high', 'US12,234,567 (Azure Architecture), US12,345,678 (Copilot System)', 'active', 'AI integration across cloud services. Key areas: LLMs, code generation, enterprise AI.'),
    ('IBM Quantum', 'Quantum Computing', 189, 'medium', 'US12,456,789 (Eagle Processor), US12,567,890 (Error Mitigation)', 'active', 'Leading quantum computing patent portfolio. Focus on hardware and error correction.'),
    ('BYD Company', 'Battery Technology', 456, 'high', 'US12,678,901 (Blade Battery), US12,789,012 (Cell-to-Pack)', 'active', 'Rapidly growing battery patent portfolio. Competing directly in EV and storage markets.'),
    ('NVIDIA Corp', 'GPU & AI Hardware', 389, 'critical', 'US12,890,123 (Hopper Architecture), US12,901,234 (NVLink)', 'active', 'Dominant AI hardware patents. Expanding into robotics, automotive, and healthcare AI.'),
    ('Pfizer Inc', 'Pharmaceuticals', 345, 'medium', 'US13,012,345 (Drug Delivery), US13,123,456 (ADC Technology)', 'active', 'Traditional pharma with growing biotech patent portfolio. Key focus on oncology and rare diseases.'),
    ('Amazon AWS', 'Cloud Infrastructure', 534, 'high', 'US13,234,567 (Graviton Chip), US13,345,678 (Serverless Architecture)', 'active', 'Extensive cloud infrastructure patents. Expanding into AI services and custom silicon.'),
    ('Huawei Technologies', '5G/6G Communications', 892, 'critical', 'US13,456,789 (5G SEP), US13,567,890 (6G Concept)', 'active', 'Largest 5G SEP holder. Aggressive filing in next-gen wireless and AI.'),
    ('Boston Dynamics', 'Robotics', 78, 'medium', 'US13,678,901 (Dynamic Balance), US13,789,012 (Legged Locomotion)', 'active', 'Specialized robotics patents. Key areas: legged robots, manipulation, and warehouse automation.'),
    ('Anthropic', 'AI Safety', 67, 'medium', 'US13,890,123 (Constitutional AI), US13,901,234 (RLHF Methods)', 'active', 'Growing AI safety and alignment patent portfolio. Focus on responsible AI deployment.'),
    ('SpaceX', 'Space Technology', 156, 'low', 'US14,012,345 (Raptor Engine), US14,123,456 (Starlink Terminal)', 'active', 'Selective patent filing strategy. Key areas: reusable rockets and satellite internet.')
  `);

  // Seed patent_filings (15 items)
  await pool.query(`
    INSERT INTO patent_filings (application_title, application_number, filing_date, jurisdiction, filing_type, status, attorney, estimated_cost, deadline, notes) VALUES
    ('AI-Powered Patent Analysis System', 'PCT/US2024/001234', '2024-03-15', 'PCT International', 'PCT', 'filed', 'Jennifer Williams, Esq.', '$15,000', '2025-03-15', 'International PCT filing for AI patent analysis platform. National phase deadline in 30 months.'),
    ('Neural Network Optimization Method', '18/234,567', '2024-02-20', 'United States', 'Utility', 'examination', 'Michael Roberts, Esq.', '$8,500', '2024-08-20', 'Non-final office action expected. Prepare response arguments for claim amendments.'),
    ('Quantum-Safe Communication Protocol', 'EP24156789', '2024-01-10', 'European Union', 'European Patent', 'filed', 'Dr. Klaus Bauer', '$22,000', '2025-01-10', 'EP filing with claims directed to quantum-resistant encryption for IoT.'),
    ('Biodegradable Sensor Platform', '2024-045678', '2024-04-05', 'Japan', 'National', 'preparing', 'Yuki Tanaka, Patent Attorney', '$12,000', '2024-10-05', 'Japanese national phase entry from PCT. Translation in progress.'),
    ('Smart Grid Load Management System', '18/345,678', '2024-01-25', 'United States', 'Utility', 'allowed', 'Sarah Chen, Esq.', '$7,200', '2024-07-25', 'Notice of Allowance received. Issue fee due within 3 months.'),
    ('CRISPR Delivery Nanoparticle', 'CN2024/098765', '2024-03-01', 'China', 'Invention', 'filed', 'Wei Liu, Patent Agent', '$9,800', '2025-03-01', 'Chinese invention patent for gene therapy delivery system.'),
    ('Autonomous Navigation Algorithm', '18/456,789', '2024-02-15', 'United States', 'Utility', 'filed', 'Robert Martinez, Esq.', '$8,000', '2024-08-15', 'Provisional conversion filed. Awaiting first office action.'),
    ('Wearable Biosensor Array', 'KR2024-0123456', '2024-03-20', 'South Korea', 'Patent', 'examination', 'Park Jin-soo, Patent Attorney', '$10,500', '2024-09-20', 'Korean patent application for multi-modal health monitoring wearable.'),
    ('Federated Learning Privacy System', 'PCT/US2024/005678', '2024-04-10', 'PCT International', 'PCT', 'filed', 'David Anderson, Esq.', '$16,000', '2025-10-10', 'PCT filing for privacy-preserving distributed ML system.'),
    ('High-Efficiency Solar Cell Design', '18/567,890', '2024-01-30', 'United States', 'Utility', 'examination', 'Linda Park, Esq.', '$7,800', '2024-07-30', 'First office action received. Prior art rejection on claims 1-5.'),
    ('Acoustic Metamaterial Barrier', 'GB2024/012345', '2024-02-28', 'United Kingdom', 'Patent', 'filed', 'James Crawford, Patent Attorney', '$11,000', '2025-02-28', 'UK patent for selective frequency sound barriers.'),
    ('DNA Digital Storage Method', '18/678,901', '2024-03-05', 'United States', 'Utility', 'preparing', 'Patricia Kim, Esq.', '$9,200', '2024-09-05', 'Finalizing specification and claims. Target filing next month.'),
    ('Robotic Manipulation Controller', 'IN2024/001234', '2024-04-01', 'India', 'Patent', 'filed', 'Raj Sharma, Patent Agent', '$6,500', '2025-04-01', 'Indian patent for advanced robotic gripper control system.'),
    ('Edge AI Inference Accelerator', '18/789,012', '2024-02-10', 'United States', 'Utility', 'filed', 'Thomas Wright, Esq.', '$8,800', '2024-08-10', 'Patent for low-power neural network inference chip architecture.'),
    ('mRNA Therapeutic Platform', 'AU2024/056789', '2024-03-25', 'Australia', 'Standard Patent', 'examination', 'Emma Wilson, Patent Attorney', '$13,500', '2024-09-25', 'Australian patent for mRNA therapeutic delivery platform.')
  `);

  // Seed citation_analyses (15 items)
  await pool.query(`
    INSERT INTO citation_analyses (patent_number, patent_title, forward_citations, backward_citations, citation_score, influential_citations, status) VALUES
    ('US9,876,543', 'Deep Neural Network Architecture', 1247, 23, 98.50, 'Cited by Google, Meta, Microsoft in 45+ subsequent patents', 'completed'),
    ('US9,765,432', 'CRISPR Guide RNA Design', 892, 18, 95.20, 'Foundational citation in gene editing field, cited by Broad Institute and UC Berkeley', 'completed'),
    ('US9,654,321', 'Lithium Battery Electrolyte', 567, 34, 87.30, 'Key citation in solid-state battery development by Toyota and Samsung SDI', 'completed'),
    ('US9,543,210', '5G Beamforming Method', 734, 28, 91.40, 'Standard-essential patent cited in 3GPP specifications', 'completed'),
    ('US9,432,109', 'Autonomous Driving Perception', 456, 41, 82.60, 'Cited by Waymo, Cruise, and Mobileye in ADAS patents', 'in_progress'),
    ('US9,321,098', 'Quantum Error Correction Code', 234, 15, 78.90, 'Cited by IBM, Google Quantum AI in error correction research', 'completed'),
    ('US9,210,987', 'mRNA Lipid Nanoparticle', 1089, 22, 96.80, 'Critical citation in COVID-19 vaccine patents by Moderna and BioNTech', 'completed'),
    ('US9,109,876', 'Blockchain Consensus Protocol', 345, 19, 79.50, 'Cited by Ethereum, Solana in consensus mechanism patents', 'completed'),
    ('US8,998,765', 'Computer Vision Object Detection', 1567, 31, 99.10, 'Most cited CV patent - referenced by virtually all object detection innovations', 'completed'),
    ('US8,887,654', 'Robotic Manipulation Method', 278, 26, 73.40, 'Cited by ABB, FANUC, and Boston Dynamics in manipulation patents', 'in_progress'),
    ('US8,776,543', 'Wireless Power Transfer System', 412, 37, 80.20, 'Key citation for Qi standard and EV wireless charging developments', 'completed'),
    ('US8,665,432', 'Natural Language Processing Model', 1823, 25, 99.50, 'Seminal NLP patent - Transformer architecture cited across all LLM innovations', 'completed'),
    ('US8,554,321', 'Solar Cell Efficiency Enhancement', 389, 42, 77.80, 'Cited by First Solar, SunPower in efficiency improvement patents', 'completed'),
    ('US8,443,210', 'IoT Security Protocol', 198, 29, 68.90, 'Referenced in IoT security standards and by major IoT platform providers', 'in_progress'),
    ('US8,332,109', 'Drug Discovery ML Platform', 567, 20, 88.70, 'Cited by Recursion, Insitro, and major pharma companies in AI drug discovery', 'completed')
  `);

  // Seed patent_translations (15 items)
  await pool.query(`
    INSERT INTO patent_translations (patent_title, source_language, target_language, original_text, translated_text, status, word_count) VALUES
    ('AI-Based Diagnostic System', 'English', 'Japanese', 'A system and method for diagnosing medical conditions using artificial intelligence analysis of patient data...', '人工知能による患者データの分析を用いた医療状態診断のシステムおよび方法...', 'completed', 8500),
    ('Quantum Computing Processor', 'English', 'Chinese', 'A quantum computing processor comprising superconducting qubits arranged in a two-dimensional lattice...', '一种量子计算处理器，包括排列在二维晶格中的超导量子比特...', 'completed', 12000),
    ('Battery Electrode Composition', 'Japanese', 'English', 'リチウムイオン二次電池用の正極活物質組成物であって...', 'A positive electrode active material composition for lithium-ion secondary batteries...', 'completed', 6800),
    ('Gene Therapy Vector Design', 'English', 'German', 'An adeno-associated virus vector engineered for targeted gene delivery to hepatocytes...', 'Ein Adeno-assoziierter Virusvektor, der für die gezielte Genabgabe an Hepatozyten entwickelt wurde...', 'in_progress', 9200),
    ('5G Antenna Array System', 'Korean', 'English', '밀리미터파 대역에서 동작하는 대규모 다중입출력 안테나 어레이 시스템...', 'A massive MIMO antenna array system operating in millimeter-wave bands...', 'completed', 7500),
    ('Autonomous Vehicle Controller', 'English', 'Korean', 'A control system for autonomous vehicles comprising a sensor fusion module and decision engine...', '센서 융합 모듈 및 의사결정 엔진을 포함하는 자율주행 차량용 제어 시스템...', 'completed', 11000),
    ('Solar Cell Manufacturing Method', 'Chinese', 'English', '一种钙钛矿太阳能电池的制备方法，包括以下步骤...', 'A method for manufacturing a perovskite solar cell comprising the following steps...', 'completed', 5400),
    ('Robotic Surgery Instrument', 'English', 'French', 'A minimally invasive surgical instrument with articulated end effector and force feedback...', 'Un instrument chirurgical mini-invasif avec effecteur terminal articulé et retour de force...', 'in_progress', 8900),
    ('Blockchain Security Protocol', 'English', 'Spanish', 'A decentralized security protocol utilizing zero-knowledge proofs for transaction validation...', 'Un protocolo de seguridad descentralizado que utiliza pruebas de conocimiento cero para la validación de transacciones...', 'completed', 6200),
    ('Drug Delivery Nanoparticle', 'German', 'English', 'Ein Nanopartikel-basiertes Arzneimittelabgabesystem für die gezielte Tumorbekämpfung...', 'A nanoparticle-based drug delivery system for targeted tumor treatment...', 'completed', 7800),
    ('IoT Sensor Network Protocol', 'English', 'Japanese', 'A low-power wireless sensor network protocol optimized for industrial IoT applications...', '産業用IoTアプリケーション向けに最適化された低消費電力無線センサーネットワークプロトコル...', 'completed', 9500),
    ('Computer Vision Algorithm', 'English', 'Chinese', 'A real-time object detection algorithm using multi-scale feature pyramid networks...', '一种使用多尺度特征金字塔网络的实时目标检测算法...', 'in_progress', 10200),
    ('Semiconductor Process Method', 'Japanese', 'English', '極端紫外線リソグラフィーを用いた半導体デバイスの製造方法...', 'A method for manufacturing semiconductor devices using extreme ultraviolet lithography...', 'completed', 8100),
    ('Wind Turbine Blade Design', 'English', 'German', 'An aerodynamic blade design for horizontal axis wind turbines with adaptive trailing edge...', 'Ein aerodynamisches Rotorblattdesign für Horizontalachs-Windkraftanlagen mit adaptiver Hinterkante...', 'completed', 6700),
    ('Neural Interface Electrode', 'English', 'French', 'A high-density neural recording electrode array with biocompatible coating...', 'Un réseau d''électrodes d''enregistrement neural haute densité avec revêtement biocompatible...', 'completed', 7300)
  `);

  // Seed landscape_analyses (15 items)
  await pool.query(`
    INSERT INTO landscape_analyses (technology_area, scope, time_period, total_patents_analyzed, key_players, white_spaces, trends, status) VALUES
    ('Large Language Models', 'Global', '2020-2024', 4567, 'Google, OpenAI, Meta, Microsoft, Anthropic, Baidu', 'Efficient inference on edge devices, Multi-modal reasoning, Domain-specific fine-tuning automation', 'Exponential growth in filings; shift from model architecture to application-specific patents', 'completed'),
    ('Solid-State Batteries', 'Global', '2019-2024', 3234, 'Toyota, Samsung SDI, QuantumScape, Solid Power, CATL', 'Scalable manufacturing processes, Room-temperature superionic conductors, Dendrite-free architectures', 'Strong growth in sulfide and oxide electrolyte patents; manufacturing scale-up filings increasing', 'completed'),
    ('CRISPR Therapeutics', 'US, EU, China', '2018-2024', 2890, 'Broad Institute, UC Berkeley, Editas, CRISPR Therapeutics, Intellia', 'In-vivo delivery systems, Base editing clinical applications, Epigenome editing', 'Shift from foundational CRISPR patents to delivery systems and clinical applications', 'completed'),
    ('Autonomous Driving L4/L5', 'Global', '2020-2024', 5678, 'Waymo, Tesla, Cruise, Mobileye, Baidu Apollo, Huawei', 'Urban complex scenario handling, Vehicle-to-everything communication integration, Weather-adaptive perception', 'Consolidation around key players; increasing focus on edge cases and safety validation', 'in_progress'),
    ('Quantum Computing Hardware', 'US, EU, China, Japan', '2019-2024', 1567, 'IBM, Google, IonQ, Rigetti, PsiQuantum, Origin Quantum', 'Room-temperature qubits, Photonic quantum computing scalability, Quantum memory', 'Growing patent activity in error correction and quantum networking', 'completed'),
    ('AR/VR Display Technology', 'Global', '2020-2024', 2345, 'Apple, Meta, Microsoft, Magic Leap, Samsung, Sony', 'Lightweight all-day wearable form factor, True holographic displays, Prescription-compatible optics', 'Shift from VR to AR-focused patents; waveguide technology dominant', 'completed'),
    ('mRNA Platform Technology', 'Global', '2019-2024', 1890, 'Moderna, BioNTech, CureVac, Pfizer, Arcturus', 'Self-amplifying mRNA optimization, Non-immunogenic mRNA, Organ-specific LNP targeting', 'Post-COVID expansion into oncology, rare diseases, and protein replacement therapy', 'completed'),
    ('Edge AI Processors', 'Global', '2020-2024', 3456, 'NVIDIA, Qualcomm, Intel, Google, Apple, MediaTek', 'Sub-1W inference chips, Analog compute-in-memory, Neuromorphic edge processors', 'Strong growth in energy-efficient inference; custom AI accelerators for specific workloads', 'in_progress'),
    ('Carbon Capture Technology', 'Global', '2018-2024', 2678, 'Carbon Engineering, Climeworks, ExxonMobil, Shell, BASF', 'Cost-effective direct air capture, Mineral carbonation at scale, CO2-to-fuel efficiency', 'Government policy driving increased filings; focus shifting from point source to DAC', 'completed'),
    ('Blockchain DeFi Protocols', 'Global', '2020-2024', 1234, 'ConsenSys, Uniswap, Aave, Chainlink, Circle', 'Cross-chain interoperability, MEV-resistant protocols, Institutional-grade DeFi', 'Peak filing in 2022; now focusing on compliance and institutional integration', 'completed'),
    ('Robotics Manipulation', 'Global', '2019-2024', 2123, 'ABB, FANUC, KUKA, Boston Dynamics, Agility Robotics', 'Dexterous human-like manipulation, Soft-rigid hybrid grippers, Tactile intelligence', 'Growing focus on AI-driven manipulation and human-robot collaboration', 'completed'),
    ('Personalized Medicine AI', 'US, EU', '2020-2024', 1678, 'Tempus, Foundation Medicine, Illumina, IBM Watson Health', 'Real-time treatment adaptation, Multi-omics integration, Predictive toxicology', 'Strong growth in AI-driven diagnostics and treatment optimization', 'in_progress'),
    ('6G Communications', 'Global', '2022-2024', 890, 'Samsung, Huawei, Nokia, Ericsson, NTT DoCoMo', 'Terahertz communication, Intelligent reflecting surfaces, Semantic communications', 'Early-stage filings increasing rapidly; focus on THz and AI-native networks', 'completed'),
    ('Green Hydrogen Production', 'Global', '2019-2024', 1456, 'Siemens Energy, Nel ASA, ITM Power, Plug Power, Air Liquide', 'High-efficiency PEM electrolyzers, Solar-to-hydrogen direct conversion, Hydrogen storage materials', 'Rapid growth driven by energy transition policies; electrolyzer efficiency key focus', 'completed'),
    ('Neuromorphic Computing', 'Global', '2020-2024', 789, 'Intel, IBM, BrainChip, SynSense, Samsung', 'Large-scale spiking neural networks, Event-driven processing platforms, Neuromorphic sensors', 'Niche but growing field; applications in edge AI and sensory processing', 'completed')
  `);

  // Seed patent_renewals (15 items)
  await pool.query(`
    INSERT INTO patent_renewals (patent_number, patent_title, jurisdiction, renewal_date, renewal_fee, status, priority, auto_renew, notes) VALUES
    ('US10,234,567', 'AI Model Compression Technology', 'United States', '2025-06-15', '$1,600', 'upcoming', 'high', true, 'Core AI patent - must renew. Revenue-generating through licensing.'),
    ('EP3,456,789', 'Wireless Charging System', 'European Union', '2025-04-20', '€2,300', 'upcoming', 'high', true, 'Key European patent with active licensing program.'),
    ('JP6,789,012', 'Battery Management Controller', 'Japan', '2025-05-10', '¥350,000', 'upcoming', 'medium', false, 'Japanese patent approaching mid-term. Review value before renewal.'),
    ('US10,345,678', 'Voice Authentication Method', 'United States', '2025-07-01', '$1,600', 'upcoming', 'high', true, 'Active enforcement against infringers. Essential to maintain.'),
    ('CN3,456,789', 'Solar Cell Manufacturing', 'China', '2025-03-25', '¥4,500', 'overdue', 'critical', false, 'URGENT: Grace period expiring. File renewal immediately.'),
    ('US10,456,789', 'Blockchain Protocol', 'United States', '2025-09-15', '$3,200', 'upcoming', 'low', false, 'Technology becoming obsolete. Consider abandonment to save costs.'),
    ('KR10-2345678', 'Display Panel Technology', 'South Korea', '2025-08-01', '₩650,000', 'upcoming', 'medium', true, 'Korean patent supporting Samsung licensing agreement.'),
    ('US10,567,890', 'Drug Delivery Nanoparticle', 'United States', '2025-04-30', '$1,600', 'upcoming', 'high', true, 'Biotech patent with high commercial value. Active clinical trials.'),
    ('DE10,2019,001234', 'Automotive Sensor Fusion', 'Germany', '2025-06-01', '€1,800', 'upcoming', 'medium', false, 'German patent supporting BMW partnership. Review terms before renewal.'),
    ('US10,678,901', 'Cloud Architecture Patent', 'United States', '2025-05-20', '$3,200', 'upcoming', 'medium', true, 'Cloud technology patent. Still generating licensing revenue.'),
    ('AU2019/345678', 'Mining Automation System', 'Australia', '2025-07-15', 'A$1,200', 'upcoming', 'low', false, 'Limited market value in Australia. Consider strategic abandonment.'),
    ('US10,789,012', 'Robotic Surgery Control', 'United States', '2025-04-10', '$1,600', 'upcoming', 'critical', true, 'High-value medical patent. Core to surgical robotics platform.'),
    ('EP3,567,890', 'Network Security Protocol', 'European Union', '2025-08-20', '€2,800', 'upcoming', 'high', true, 'European cybersecurity patent with multiple licensees.'),
    ('US10,890,123', 'AR Display Waveguide', 'United States', '2025-10-01', '$1,600', 'upcoming', 'medium', false, 'AR technology patent. Growing market but revenue not yet significant.'),
    ('IN2019/012345', 'Telemedicine Platform', 'India', '2025-05-15', '₹20,000', 'upcoming', 'medium', true, 'Indian patent for telehealth platform. Growing market importance.')
  `);

  // Seed collaboration_items (15 items)
  await pool.query(`
    INSERT INTO collaboration_items (title, description, assigned_to, task_type, priority, status, due_date, patent_reference, comments) VALUES
    ('Review AI Patent Claims Draft', 'Review and provide feedback on independent claims for the AI diagnostic system patent', 'Dr. Sarah Kim', 'Review', 'high', 'in_progress', '2025-04-01', 'US-APP-18/234,567', 'Claims need to be broader. Suggest removing implementation-specific limitations from Claim 1.'),
    ('Conduct Freedom-to-Operate Search', 'FTO analysis for new quantum computing module before product launch', 'James Williams', 'Research', 'critical', 'open', '2025-03-25', NULL, 'Priority task - product launch depends on FTO clearance. Focus on IBM and Google patents.'),
    ('File PCT Application', 'Prepare and file PCT application for biodegradable sensor technology', 'Jennifer Park, Esq.', 'Filing', 'high', 'in_progress', '2025-04-15', 'PCT/US2025/001234', 'Specification complete. Need final inventor signatures and assignment documents.'),
    ('Respond to Office Action', 'Prepare response to USPTO office action on battery technology patent', 'Michael Chen, Esq.', 'Legal', 'critical', 'open', '2025-03-30', 'US-APP-18/345,678', 'Examiner rejected Claims 1-5 over prior art. Need to amend claims and argue distinction.'),
    ('Update Patent Portfolio Dashboard', 'Refresh portfolio analytics with Q1 2025 filing data and valuation updates', 'Lisa Thompson', 'Analytics', 'medium', 'open', '2025-04-10', NULL, 'Include new acquisitions from TechVision deal and updated market valuations.'),
    ('Inventor Interview - ML Patent', 'Schedule and conduct inventor interview for new ML optimization invention', 'Dr. Robert Chen', 'Invention Disclosure', 'medium', 'in_progress', '2025-04-05', NULL, 'Inventor available Tuesdays and Thursdays. Prepare questionnaire focused on novel aspects.'),
    ('Competitor Patent Alert Review', 'Review weekly competitor patent alerts and flag relevant filings', 'Anna Schmidt', 'Monitoring', 'medium', 'open', '2025-03-21', NULL, 'Focus on Tesla, Google, and Samsung filings in autonomous vehicle and AI areas.'),
    ('Prepare Licensing Agreement', 'Draft licensing terms for 5G patent portfolio license to Carrier Corp', 'David Anderson, Esq.', 'Legal', 'high', 'in_progress', '2025-04-20', 'EP3,456,789', 'FRAND terms required for SEPs. Include cross-license provisions.'),
    ('Patent Valuation Update', 'Update valuations for top 20 patents in the portfolio for board presentation', 'Thomas Wright', 'Valuation', 'high', 'open', '2025-04-08', NULL, 'Use income approach for revenue-generating patents. Board meeting on April 15.'),
    ('Prior Art Search - Graphene Battery', 'Comprehensive prior art search for graphene-enhanced battery electrode invention', 'Emma Johnson', 'Research', 'medium', 'in_progress', '2025-04-12', NULL, 'Focus on Samsung SDI and CATL filings. Include academic publications from Nature Energy.'),
    ('File Continuation Application', 'Prepare and file continuation for AI voice assistant patent', 'Patricia Kim, Esq.', 'Filing', 'medium', 'open', '2025-04-25', 'US10,456,789', 'Parent patent claims allowed. Continuation to cover additional embodiments in voice emotion detection.'),
    ('Annual Renewal Audit', 'Audit all patents due for renewal in Q2 2025 and recommend keep/abandon', 'Sarah Chen', 'Administrative', 'high', 'open', '2025-03-28', NULL, '47 patents due for renewal in Q2. Budget cap of $150K. Prioritize revenue-generating patents.'),
    ('Draft Response to IPR Petition', 'Prepare response to inter partes review petition challenging battery patent', 'Robert Martinez, Esq.', 'Legal', 'critical', 'in_progress', '2025-03-22', 'US10,890,123', 'Petitioner argues claims 1-4 obvious. Need to distinguish prior art and provide expert declarations.'),
    ('Technology Landscape Report', 'Compile Q1 2025 technology landscape report for AI in healthcare', 'Dr. Nina Patel', 'Research', 'medium', 'open', '2025-04-30', NULL, 'Cover diagnostic AI, drug discovery, and clinical decision support. Include filing trend charts.'),
    ('Coordinate Foreign Filing Program', 'Manage national phase entries for 5 PCT applications in priority jurisdictions', 'Linda Chang', 'Filing', 'high', 'in_progress', '2025-04-18', NULL, 'Applications entering national phase in US, EP, JP, KR, CN. Coordinate with local agents.')
  `);

  console.log('✅ Database seeded successfully with 15 items per feature!');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});

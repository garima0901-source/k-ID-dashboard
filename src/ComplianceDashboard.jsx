/**
 * ComplianceDashboard.jsx
 * Global Child Safety Compliance Intelligence
 *
 * Dependencies: npm install d3 topojson-client
 * Tailwind CSS must be configured in your project.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const REGULATIONS = [
  {
    id: 1, country: "United States", countryCode: "US", region: "Americas",
    regulationName: "Children's Online Privacy Protection Act", shortName: "COPPA",
    status: "enforced", effectiveDate: "2000-04-21",
    enforcementBody: "Federal Trade Commission (FTC)",
    maxPenalty: "$53,088 per violation per day", riskScore: 8,
    appliesTo: "Online services directed at children under 13 or with actual knowledge of child users",
    keyRequirements: "Obtain verifiable parental consent before collecting any personal data from children under 13; Provide parents the right to review and delete their child's data at any time; Must not retain children's data longer than reasonably necessary and may not condition service access on providing more data than necessary",
    recentEnforcement: "Epic Games fined $275M (Dec 2022, FTC/DOJ consent decree) — largest COPPA settlement in history. YouTube fined $170M (Sep 2019, FTC/NY AG). Amazon Alexa fined $25M (May 2023) for retaining children's voice recordings. Combined COPPA enforcement total exceeds $470M."
  },
  {
    id: 2, country: "United States", countryCode: "US", region: "Americas",
    regulationName: "Children and Teens' Online Privacy Protection Act", shortName: "COPPA 2.0",
    status: "pending", effectiveDate: "TBD",
    enforcementBody: "Federal Trade Commission (FTC)",
    maxPenalty: "~$53,088 per violation (proposed)", riskScore: 6,
    appliesTo: "Online services directed at children under 17",
    keyRequirements: "Expands parental consent requirement to cover all users under 17 (up from under 13 in original COPPA); Bans targeted advertising to anyone under 17 and prohibits manipulative design features (dark patterns) directed at minors; Operators must honor a right of erasure for users under 17 and their parents or guardians",
    recentEnforcement: "No enforcement actions — bill not yet enacted. Passed Senate Commerce Committee Jul 2024; full Senate floor vote pending. Industry groups actively lobbying against age-extension provisions."
  },
  {
    id: 3, country: "United States – California", countryCode: "US-CA", region: "Americas",
    regulationName: "California Age Appropriate Design Code Act (AB-2273)", shortName: "CA AADC",
    status: "pending", effectiveDate: "Signed 2022; enforcement stayed",
    enforcementBody: "California Attorney General",
    maxPenalty: "$7,500 per intentional violation; $2,500 per unintentional", riskScore: 4,
    appliesTo: "Online products and services likely to be accessed by children under 18 in California",
    keyRequirements: "Conduct a Data Protection Impact Assessment (DPIA) before deploying any product likely to be accessed by children; Enable the highest privacy settings by default for child users and prohibit dark patterns that nudge children toward less private options; Prohibited from collecting, selling or retaining children's personal data beyond what is strictly necessary to provide the service",
    recentEnforcement: "Enforcement blocked by federal courts — 9th Circuit upheld preliminary injunction in NetChoice v. Bonta (2024). Constitutionality under appeal; enforcement cannot begin until litigation is resolved."
  },
  {
    id: 4, country: "United Kingdom", countryCode: "GB", region: "Europe",
    regulationName: "Age Appropriate Design Code (Children's Code)", shortName: "UK Children's Code",
    status: "enforced", effectiveDate: "2021-09-02",
    enforcementBody: "Information Commissioner's Office (ICO)",
    maxPenalty: "£17.5M or 4% of global annual turnover (whichever greater)", riskScore: 9,
    appliesTo: "Online products and services likely to be accessed by children under 18 in the UK",
    keyRequirements: "Apply privacy by default — set the highest privacy settings as the default for any user likely to be a child; Prohibited from using nudge techniques or dark patterns to lead children toward options that reduce their privacy; Collect only minimum data necessary and do not profile children for commercial purposes unless demonstrably in the child's best interests",
    recentEnforcement: "TikTok fined £12.7M by ICO (Apr 2023) for unlawfully processing data of up to 1.4M UK children. ICO named children's online privacy a 2024–25 enforcement priority with 11 active investigations. 55 organisations received compliance advice notices."
  },
  {
    id: 5, country: "European Union", countryCode: "EU", region: "Europe",
    regulationName: "General Data Protection Regulation – Article 8 (Child Consent)", shortName: "GDPR Art. 8",
    status: "enforced", effectiveDate: "2018-05-25",
    enforcementBody: "National Data Protection Authorities (DPAs) across all EU member states",
    maxPenalty: "€20M or 4% of global annual turnover (whichever greater)", riskScore: 9,
    appliesTo: "Information society services offered directly to children; consent age 13–16 depending on member state",
    keyRequirements: "Obtain parental or guardian consent before processing data of children below the national age threshold (13 to 16 depending on member state); Make reasonable efforts to verify that consent was actually given by a parent or guardian — self-declaration alone is insufficient; Provide privacy information in clear, plain language tailored to the age of the child",
    recentEnforcement: "Instagram (Meta) fined €405M by Irish DPC (Sep 2022) for misconfigured privacy settings exposing children's accounts. TikTok fined €345M by Irish DPC (Sep 2023) for default-public settings on children's accounts. Both fines subject to ongoing appeal."
  },
  {
    id: 6, country: "European Union", countryCode: "EU", region: "Europe",
    regulationName: "Digital Services Act – Article 28 (Protection of Minors)", shortName: "DSA Art. 28",
    status: "enforced", effectiveDate: "2024-02-17",
    enforcementBody: "European Commission and National Digital Services Coordinators (DSCs)",
    maxPenalty: "6% of global annual turnover", riskScore: 8,
    appliesTo: "All online platforms accessible to minors; VLOPs face enhanced obligations",
    keyRequirements: "Prohibited from presenting profiling-based targeted advertising to users known or reasonably suspected to be minors; Self-declaration alone is not acceptable age assurance — platforms must implement proportionate and reliable age verification methods; VLOPs must conduct annual systemic risk assessments covering risks to minors and implement proportionate mitigation measures",
    recentEnforcement: "TikTok fined €530M by European Commission (Apr 2025) — first major DSA enforcement action — for data transfers to China and failure to protect minors. Meta, YouTube, and Snap remain under active preliminary investigation."
  },
  {
    id: 7, country: "France", countryCode: "FR", region: "Europe",
    regulationName: "Loi n° 2024-449 – Sécuriser et Réguler l'Espace Numérique (SREN Law)", shortName: "SREN Law",
    status: "enforced", effectiveDate: "2024-05-22",
    enforcementBody: "ARCOM / CNIL",
    maxPenalty: "€250,000 per day of non-compliance", riskScore: 8,
    appliesTo: "Pornographic and adult content platforms accessible in France",
    keyRequirements: "Pornographic sites must implement technically certified age verification meeting ARCOM's published standard before granting any access to explicit content; Must apply the double anonymity principle — the platform must not know the user's identity and the age verification provider must not know which platform was visited; ARCOM may order ISPs to block non-compliant platforms and platforms must show a clean screen with no explicit content until age has been verified",
    recentEnforcement: "ARCOM published certified age-verification technical standard (Oct 2024). ISP blocking orders issued against Pornhub and non-compliant adult platforms (Feb 2025) after they missed the compliance deadline. TikTok also received a formal compliance notice."
  },
  {
    id: 8, country: "Germany", countryCode: "DE", region: "Europe",
    regulationName: "Jugendschutzgesetz – Youth Protection Act (2021 Reform)", shortName: "JuSchG",
    status: "enforced", effectiveDate: "2021-05-01",
    enforcementBody: "Federal Centre for Protection of Minors in Media (BzKJ); KidD",
    maxPenalty: "€50,000 per administrative violation", riskScore: 7,
    appliesTo: "Digital products and services accessible to minors in Germany",
    keyRequirements: "Implement safe default settings limiting interaction risks for minors (e.g. disable chat with strangers by default on children's accounts); Provide child-friendly terms and conditions and low-threshold reporting and help systems accessible to minors; Apply official age ratings to all digital content and account for interaction risks such as cyberbullying and in-app purchases in age classification",
    recentEnforcement: "BzKJ classified major platforms under youth-protection risk framework 2022–2024. KidD (children's rights enforcement body for digital services) became operational Jan 2024. First formal compliance orders anticipated 2025."
  },
  {
    id: 9, country: "Ireland", countryCode: "IE", region: "Europe",
    regulationName: "DPC Fundamentals for a Child-Oriented Approach to Data Processing", shortName: "DPC Children's Fundamentals",
    status: "enforced", effectiveDate: "2021-12-17",
    enforcementBody: "Data Protection Commission (DPC)",
    maxPenalty: "€20M or 4% of global annual turnover (GDPR penalties apply)", riskScore: 9,
    appliesTo: "Online services processing personal data of children under 18; Ireland is lead EU supervisor for most major US tech platforms",
    keyRequirements: "Apply the child's best interests as a primary consideration in all data processing decisions affecting children; Do not use children's personal data for commercial profiling or advertising unless a compelling child-centered justification exists; Conduct a DPIA for any processing likely to affect children and default to high-privacy settings on all child-facing products",
    recentEnforcement: "TikTok fined €345M (Sep 2023) after DPC found children's accounts defaulted to public with no parental notification. Meta fined €405M (Sep 2022) over Instagram age-inappropriate defaults. Ireland's lead-supervisory status gives these decisions EU-wide effect."
  },
  {
    id: 10, country: "Canada", countryCode: "CA", region: "Americas",
    regulationName: "Personal Information Protection and Electronic Documents Act", shortName: "PIPEDA",
    status: "enforced", effectiveDate: "2001-01-01",
    enforcementBody: "Office of the Privacy Commissioner of Canada (OPC)",
    maxPenalty: "CAD $100,000 per violation", riskScore: 5,
    appliesTo: "Private sector organisations collecting personal information for commercial purposes",
    keyRequirements: "Obtain meaningful, informed consent before collecting, using or disclosing personal information — parental consent required where the child lacks capacity; Individuals have the right to access and request correction of their personal information held by organisations; Collect only the minimum personal information necessary for the identified purpose (data minimization principle)",
    recentEnforcement: "TikTok investigated by OPC (2021–2022) — found violations; TikTok made privacy changes under agreement. Bill C-27 (Consumer Privacy Protection Act — successor with stronger children's protections) passed 2nd reading in House of Commons; Senate adoption pending."
  },
  {
    id: 11, country: "Brazil", countryCode: "BR", region: "Americas",
    regulationName: "Lei Geral de Proteção de Dados Pessoais (General Data Protection Law)", shortName: "LGPD",
    status: "enforced", effectiveDate: "2020-09-18",
    enforcementBody: "National Data Protection Authority (ANPD)",
    maxPenalty: "2% of Brazil revenue up to R$50M per violation", riskScore: 7,
    appliesTo: "All entities processing personal data in Brazil; children's data classified as sensitive",
    keyRequirements: "Children's data is classified as sensitive data requiring specific and highlighted parental or guardian consent before processing; Processing must serve the child's best interests and any processing harmful to children is prohibited; Must conduct a DPIA before processing children's sensitive data and apply strict data minimization throughout",
    recentEnforcement: "ANPD issued its first administrative fine of R$1.9M against Telefônica Brasil (Aug 2023). Children's data consultation launched 2024 to develop specific implementing regulations. Full enforcement of children's provisions is actively ramping up."
  },
  {
    id: 12, country: "Brazil", countryCode: "BR", region: "Americas",
    regulationName: "Estatuto da Criança e do Adolescente Digital – Digital Children's Statute", shortName: "Digital ECA",
    status: "enforced", effectiveDate: "2025-01-01",
    enforcementBody: "National Data Protection Authority (ANPD)",
    maxPenalty: "10% of Brazil revenue or R$50M per violation (whichever greater)", riskScore: 8,
    appliesTo: "Online platforms and digital services accessible to children and adolescents under 18",
    keyRequirements: "Must implement effective and reliable age verification mechanisms before granting access — self-declaration is expressly prohibited; Profiling, behavioral advertising and data-driven targeting of any user under 18 are absolutely prohibited; Accounts for users under 16 must be linked to a parent or guardian's account and platforms must publish a children's safety and health impact assessment",
    recentEnforcement: "Enacted Aug 2024; entered into force Jan 2025. No enforcement actions yet — ANPD developing implementing regulations. Platforms have a 12-month compliance window expiring Jan 2026."
  },
  {
    id: 13, country: "Argentina", countryCode: "AR", region: "Americas",
    regulationName: "Ley de Protección de Datos Personales – Personal Data Protection Act", shortName: "PDPA (Law 25.326)",
    status: "enforced", effectiveDate: "2000-10-30",
    enforcementBody: "Access to Public Information Agency (AAIP)",
    maxPenalty: "ARS 3,000 maximum administrative fine (law under reform)", riskScore: 5,
    appliesTo: "All entities processing personal data of Argentine residents",
    keyRequirements: "Processing children's data requires parental or guardian consent as children under 13 cannot independently consent to online services; Data controllers must register databases containing personal information with the AAIP national registry; Data subjects and guardians have rights to access, rectify and delete personal data held about them",
    recentEnforcement: "AAIP issued 35 resolutions in 2023; fines capped at a token ARS 3,000 under the 2000-era law. Reform bill proposing penalties up to ARS 200M is pending congressional approval. No major children-specific public fines reported."
  },
  {
    id: 14, country: "Mexico", countryCode: "MX", region: "Americas",
    regulationName: "Ley Federal de Protección de Datos Personales en Posesión de los Particulares", shortName: "LFPDPPP",
    status: "enforced", effectiveDate: "2010-07-05",
    enforcementBody: "Secretariat of Anti-Corruption and Good Governance (SABG)",
    maxPenalty: "Fines up to 320,000 days of minimum wage (~MXN 36M)", riskScore: 5,
    appliesTo: "Private sector entities processing personal data in Mexico",
    keyRequirements: "Must provide a clear, accessible privacy notice (aviso de privacidad) before or at the point of collecting personal data; Parental consent required to process data of minors and consent must be freely given, specific and informed; Data subjects have ARCO rights (access, rectification, cancellation and opposition) enforceable against all data controllers",
    recentEnforcement: "Enforcement authority INAI was dissolved May 2025; responsibilities transferred to the new SABG. Several telecoms fined for data protection failures. Children-specific enforcement has been limited due to resource constraints."
  },
  {
    id: 15, country: "Australia", countryCode: "AU", region: "Asia-Pacific",
    regulationName: "Online Safety Act 2021 + Social Media Minimum Age Act 2024", shortName: "Online Safety Act",
    status: "enforced", effectiveDate: "2021 / 2025",
    enforcementBody: "eSafety Commissioner",
    maxPenalty: "AUD $49.5M per platform", riskScore: 8,
    appliesTo: "Social media platforms and online services; under-16 ban from social media",
    keyRequirements: "Social media platforms must take reasonable steps to prevent users under 16 from creating or keeping accounts — no parental consent exception applies; Any data collected solely for age verification must only be used for that purpose and cannot be repurposed or disclosed; Platforms must comply with Online Safety Codes covering harmful content protections and child-safe design standards",
    recentEnforcement: "eSafety Commissioner issued $6.5M infringement notice to X (Twitter) for CSAM response failures (2024). Age-verification pilot for adult content sites launched 2024. Under-16 social media ban enforcement commenced Jan 2025."
  },
  {
    id: 16, country: "South Korea", countryCode: "KR", region: "Asia-Pacific",
    regulationName: "Personal Information Protection Act", shortName: "PIPA",
    status: "enforced", effectiveDate: "2011-09-30",
    enforcementBody: "Personal Information Protection Commission (PIPC)",
    maxPenalty: "Up to 10% of total annual revenue (2026 amendment); previously 3%", riskScore: 8,
    appliesTo: "All data controllers; children under 14 require legal representative consent",
    keyRequirements: "Must obtain consent from the legal representative (parent or guardian) of any child under 14 before collecting or processing their personal data; Notify child users using clear, simple and age-appropriate language when collecting their personal information; Verify that each user is aged 14 or older before processing without parental consent and collect only the minimum data necessary",
    recentEnforcement: "Meta fined KRW 6.75B (~$5.1M) by PIPC (Sep 2022) for collecting sensitive data without consent. Kakao Pay fined KRW 9.83B (2023). Multiple platforms under investigation for children's data compliance under 2023 PIPA amendments."
  },
  {
    id: 17, country: "Japan", countryCode: "JP", region: "Asia-Pacific",
    regulationName: "Act on the Protection of Personal Information", shortName: "APPI",
    status: "enforced", effectiveDate: "2005-04-01",
    enforcementBody: "Personal Information Protection Commission (PPC)",
    maxPenalty: "JPY 100M for corporations; children-specific provisions est. 2027", riskScore: 5,
    appliesTo: "All personal information handlers in Japan; guardian consent for under ~15",
    keyRequirements: "Must obtain consent from the child's legal guardian if the child lacks capacity to assess the consequences of consent (generally under approx. 15); Provide a clear privacy notice to data subjects and enable requests for disclosure, correction and deletion of retained personal data; Implement security management measures proportionate to the risk of unauthorised access, loss or falsification of personal data",
    recentEnforcement: "PPC issued corrective orders to LINE Yahoo (2021) and NTT Docomo (2023) for data protection failures. No dedicated children's enforcement actions yet. Children-specific chapter of APPI expected in reform legislation around 2027."
  },
  {
    id: 18, country: "China", countryCode: "CN", region: "Asia-Pacific",
    regulationName: "Personal Information Protection Law", shortName: "PIPL",
    status: "enforced", effectiveDate: "2021-11-01",
    enforcementBody: "Cyberspace Administration of China (CAC) / SAMR",
    maxPenalty: "CNY 50M (~USD 7M) or 5% of annual revenue for serious violations", riskScore: 8,
    appliesTo: "All personal information processors; children under 14 treated as sensitive data category",
    keyRequirements: "Personal data of children under 14 is classified as sensitive — must develop a dedicated child privacy policy and obtain explicit parental consent; Conduct a Personal Information Protection Impact Assessment (PIPIA) before processing children's sensitive data; Restrict processing to the minimum necessary and obtain separate parental authorisation before sharing children's data with any third party",
    recentEnforcement: "Didi Chuxing fined CNY 8.026B (~$1.18B) by CAC (Jul 2022). Over 100 apps removed from Chinese app stores for PIPL violations 2022–2024. Alibaba, Tencent, and ByteDance each received compliance orders and significant fines."
  },
  {
    id: 19, country: "China", countryCode: "CN", region: "Asia-Pacific",
    regulationName: "Regulations on the Protection of Minors in Cyberspace (Decree No. 766)", shortName: "Minors Cyberspace Regulation",
    status: "enforced", effectiveDate: "2024-01-01",
    enforcementBody: "Cyberspace Administration of China (CAC) + multi-ministry enforcement",
    maxPenalty: "CNY 50M or 5% annual revenue; administrative suspension; closure", riskScore: 9,
    appliesTo: "Online platforms and digital services accessible to minors under 18; mandates minor mode",
    keyRequirements: "Platforms must activate a minor mode enforcing daily screen-time limits (1 hr/day for under 16 or 2 hrs/day for 16-17) and block service between 10pm and 6am; Algorithm recommendation systems must not push content harmful to minors' wellbeing or induce addictive use and targeted recommendation to minors is prohibited; Must implement age verification and parental control systems allowing guardians to manage and override minors' account settings and usage limits",
    recentEnforcement: "CAC removed 168 apps from stores for minor-mode non-compliance in Q1 2024. Douyin (TikTok China) and Kuaishou required to cap minor daily use at 40 minutes. ByteDance fined CNY 8M for algorithm recommendations targeting minors (2024)."
  },
  {
    id: 20, country: "India", countryCode: "IN", region: "Asia-Pacific",
    regulationName: "Digital Personal Data Protection Act 2023", shortName: "DPDP Act",
    status: "pending", effectiveDate: "2023-08-11 (enacted); rules pending",
    enforcementBody: "Data Protection Board of India (DPB) — being constituted",
    maxPenalty: "INR 200 crore (~USD 24M) for children's data violations", riskScore: 6,
    appliesTo: "All data fiduciaries; age of child set at under 18; profiling/advertising to children prohibited",
    keyRequirements: "Obtain verifiable parental or guardian consent before processing personal data of any user under 18 and verify the consenting parent is a non-minor adult; Absolutely prohibited from tracking, behaviorally monitoring, profiling or serving targeted advertising to any person under 18; Must conduct age verification to confirm whether a user is a child before processing their personal data",
    recentEnforcement: "No enforcement actions — Data Protection Board not yet constituted (Apr 2026). MeITY released draft implementing rules Jan 2025; final rules expected mid-2026. Significant industry lobbying over consent mechanisms for parental verification."
  },
  {
    id: 21, country: "Singapore", countryCode: "SG", region: "Asia-Pacific",
    regulationName: "Personal Data Protection Act + Advisory Guidelines on Children's Personal Data (2024)", shortName: "PDPA / Children's Advisory",
    status: "enforced", effectiveDate: "PDPA: 2014; Advisory: 2024",
    enforcementBody: "Personal Data Protection Commission (PDPC)",
    maxPenalty: "SGD 1M or 10% of annual Singapore turnover", riskScore: 7,
    appliesTo: "All organisations collecting personal data in Singapore; parental consent under 13",
    keyRequirements: "Parental or guardian consent is mandatory for children under 13 and ages 13-17 are assessed case-by-case on their capacity to understand the consequences of consent; Communicate all privacy information in plain, age-appropriate language suited to the child's developmental stage; Apply higher data protection standards for children including strict purpose limitation, data minimization and enhanced security measures",
    recentEnforcement: "PDPC fined multiple organisations for data protection failures (2022–2024). 2024 Children's Advisory triggered enhanced PDPC audits of apps popular with minors. Outcomes of children's-specific investigations pending public disclosure."
  },
  {
    id: 22, country: "Indonesia", countryCode: "ID", region: "Asia-Pacific",
    regulationName: "Personal Data Protection Law (UU PDP) + Government Regulation 17/2025 on Child Online Protection", shortName: "PDP Law / COPR",
    status: "enforced", effectiveDate: "2022-10-17 (PDP Law); GR 17/2025",
    enforcementBody: "Ministry of Communication and Digital (MOCD)",
    maxPenalty: "Admin fines up to 2% of annual revenue; criminal fines up to IDR 6B", riskScore: 5,
    appliesTo: "All personal data controllers; children's data classified as specific/sensitive personal data",
    keyRequirements: "Must implement an age-segmented verification system (covering age groups 3-5 through 16-17) with safety features appropriate to each group; Obtain active parental consent before a child accesses any product or service and provide a 24-hour parental consent window for users under 17; Set high-privacy defaults for all child accounts and conduct a DPIA before processing children's personal data",
    recentEnforcement: "MOCD conducted 47 platform compliance assessments in 2024. Government Regulation 17/2025 on Child Online Protection took effect Mar 2025. First enforcement actions under the new child protection regulation expected H2 2025."
  },
  {
    id: 23, country: "Saudi Arabia", countryCode: "SA", region: "Middle East & Africa",
    regulationName: "Personal Data Protection Law", shortName: "PDPL",
    status: "enforced", effectiveDate: "2023-09-14",
    enforcementBody: "Saudi Data and Artificial Intelligence Authority (SDAIA) / NDMO",
    maxPenalty: "SAR 5M (~USD 1.3M); doubled for repeat violations", riskScore: 7,
    appliesTo: "All entities processing personal data in Saudi Arabia; minors' data treated as sensitive",
    keyRequirements: "Personal data of minors is treated as sensitive data requiring specific consent and proportionate protective measures; Controllers processing data of vulnerable individuals including minors must register in the NDMO National Register; Provide privacy notices in clear and simple language understandable to minors and apply strict data minimization and purpose limitation",
    recentEnforcement: "No public enforcement decisions yet — SDAIA focused on controller registration (Sep 2024 deadline) and compliance awareness. Major international tech platforms assessed for compliance. First enforcement actions expected 2025–2026."
  },
  {
    id: 24, country: "United Arab Emirates", countryCode: "AE", region: "Middle East & Africa",
    regulationName: "Federal Decree-Law No. 26 of 2025 on Child Digital Safety", shortName: "UAE Child Digital Safety Law",
    status: "enforced", effectiveDate: "2026-01-01",
    enforcementBody: "TDRA; Child Digital Safety Council",
    maxPenalty: "Administrative penalties; partial/full service blocking and closure", riskScore: 7,
    appliesTo: "All digital platforms accessible to minors in the UAE",
    keyRequirements: "Platforms must implement effective age verification and may not collect or process data of children under 13 without explicit documented parental consent; Activate content blocking, filtering and age-rating tools by default and set high-privacy settings as the default for children's accounts; Prohibited from commercialising children's data or targeting advertising at minors and must immediately report CSAM to authorities",
    recentEnforcement: "Law effective Jan 2026 — no fines issued yet. TDRA published implementing guidelines (Dec 2025). Child Digital Safety Council held inaugural meeting Jan 2026. First compliance audit reports expected Q2 2026."
  },
  {
    id: 25, country: "South Africa", countryCode: "ZA", region: "Middle East & Africa",
    regulationName: "Protection of Personal Information Act", shortName: "POPIA",
    status: "enforced", effectiveDate: "2021-07-01",
    enforcementBody: "Information Regulator",
    maxPenalty: "ZAR 10M (~USD 540K); up to 10 years imprisonment for criminal offences", riskScore: 7,
    appliesTo: "All responsible parties processing personal information; children under 18",
    keyRequirements: "Processing of children's personal information is generally prohibited unless parental or guardian consent is obtained and processing serves the child's best interests; The Information Regulator must be notified and prior authorisation obtained for certain high-risk processing of children's data; Children's personal information must be collected directly from the child or guardian and transfer to third parties requires specific authorisation",
    recentEnforcement: "Information Regulator issued enforcement notice to SA Department of Justice after ransomware breach (2022). Debt collector fined ZAR 5M (2023) for unlawful processing. First children-focused social media investigation opened by the Regulator in 2024."
  },
  {
    id: 26, country: "Nigeria", countryCode: "NG", region: "Middle East & Africa",
    regulationName: "Nigeria Data Protection Act 2023", shortName: "NDPA",
    status: "enforced", effectiveDate: "2023-06-12",
    enforcementBody: "Nigeria Data Protection Commission (NDPC)",
    maxPenalty: "NGN 10M or 2% of annual gross revenue (whichever higher)", riskScore: 6,
    appliesTo: "All personal data controllers and processors; children defined as under 18",
    keyRequirements: "Must obtain parental or guardian consent before processing personal data of any person under 18 and implement age verification mechanisms to identify child users; Apply appropriate mechanisms to verify whether a data subject is a minor before processing to determine if parental consent is needed; Data controllers must register with the NDPC and implement security measures adequate to the risk of harm to children as vulnerable data subjects",
    recentEnforcement: "NDPC registered 300+ data controllers by end-2024. Three major fintech platforms issued corrective orders after 2024 compliance audit. Draft children's data regulations published for public comment Jan 2025."
  },
  {
    id: 27, country: "Kenya", countryCode: "KE", region: "Middle East & Africa",
    regulationName: "Data Protection Act (No. 24 of 2019)", shortName: "Kenya DPA",
    status: "enforced", effectiveDate: "2019-11-25",
    enforcementBody: "Office of the Data Protection Commissioner (ODPC)",
    maxPenalty: "KES 5M (~USD 38K) or 1% of annual turnover (whichever lower)", riskScore: 6,
    appliesTo: "All data controllers and processors; parental/guardian consent required for children",
    keyRequirements: "Processing of children's personal data is prohibited unless consent is given by a parent or guardian and processing advances the child's best interests; Must incorporate age verification and parental consent mechanisms into digital products and services accessible to children; Data minimization, purpose limitation and the right for parents or guardians to request erasure of children's data apply",
    recentEnforcement: "ODPC issued enforcement notices to Nairobi Hospital and National Transport Authority (2023). No children-specific fines yet — ODPC building enforcement capacity. First children-focused digital platform investigation expected 2025."
  },
  {
    id: 28, country: "Turkey", countryCode: "TR", region: "Europe",
    regulationName: "Kişisel Verileri Koruma Kanunu (Personal Data Protection Law)", shortName: "KVKK",
    status: "enforced", effectiveDate: "2016-04-07",
    enforcementBody: "Personal Data Protection Authority (KVKK Board)",
    maxPenalty: "TRY 1,000 (~USD 30K) max admin fine; criminal fines under Turkish Penal Code", riskScore: 6,
    appliesTo: "All data controllers processing personal data in Turkey; minors under 18 require custodial consent",
    keyRequirements: "Processing personal data of minors under 18 requires the consent of the parent holding legal custody under the Turkish Civil Code (Article 335); Data controllers above the regulatory threshold must register in the Data Controllers' Registry (VERBİS) and maintain records of processing activities; Data subjects and their guardians have the right to request access, correction, deletion or destruction of personal data held about them",
    recentEnforcement: "TikTok fined TRY 1M (~$60K) by KVKK (Nov 2021) for processing children's data without appropriate safeguards. Multiple Turkish telecoms and e-commerce companies fined for data protection failures 2022–2024."
  },
  {
    id: 29, country: "Israel", countryCode: "IL", region: "Middle East & Africa",
    regulationName: "Privacy Protection Law 5741-1981 + Amendment No. 13 (2024/2025)", shortName: "PPL / Amendment 13",
    status: "enforced", effectiveDate: "1981 (original); Amendment 13: 2025",
    enforcementBody: "Privacy Protection Authority (PPA)",
    maxPenalty: "Millions of NIS depending on severity and data sensitivity", riskScore: 6,
    appliesTo: "All database owners and data processors in Israel; minors under 18 require guardian consent",
    keyRequirements: "Processing personal data of minors under 18 requires consent from their legal guardian per Israel's Legal Capacity and Guardianship Law; Database owners holding personal information on Israeli residents above the regulatory threshold must register the database with the PPA; Data subjects and guardians have the right to review and request correction of data in registered databases and Amendment 13 introduces significant monetary penalties for non-compliance",
    recentEnforcement: "Walla Communications fined NIS 700K (2022) for database security failures. PPA issued children's data protection guidance (Dec 2024). Amendment 13 (enacted 2025) brought significant new monetary penalties; first cases under the new regime expected 2026."
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// FLAG LOOKUP
// ─────────────────────────────────────────────────────────────────────────────
const FLAGS = {
  US: "🇺🇸", "US-CA": "🇺🇸", GB: "🇬🇧", EU: "🇪🇺",
  FR: "🇫🇷", DE: "🇩🇪", IE: "🇮🇪", CA: "🇨🇦",
  BR: "🇧🇷", AR: "🇦🇷", MX: "🇲🇽", AU: "🇦🇺",
  KR: "🇰🇷", JP: "🇯🇵", CN: "🇨🇳", IN: "🇮🇳",
  SG: "🇸🇬", ID: "🇮🇩", SA: "🇸🇦", AE: "🇦🇪",
  ZA: "🇿🇦", NG: "🇳🇬", KE: "🇰🇪", TR: "🇹🇷", IL: "🇮🇱",
};

// ─────────────────────────────────────────────────────────────────────────────
// ENFORCEMENT TIMELINE DATA  (sourced from enforcement_timeline.xlsx)
// ─────────────────────────────────────────────────────────────────────────────
const ENFORCEMENT_ACTIONS = [
  {
    id: 1,
    date: "2019-02-27",
    country: "USA", flag: "🇺🇸", region: "Americas",
    entity: "Musical.ly / TikTok (ByteDance)",
    entityShort: "TikTok / Musical.ly",
    regulation: "COPPA",
    actionType: "Civil Penalty + Injunction",
    actionCategory: "Civil Penalty",
    description: "Musical.ly collected names, emails, photos and phone numbers from children under 13 without parental consent; received thousands of parent complaints confirming underage users. Required to delete all videos posted by underage users.",
    penaltyUSD: 5700000,
    penaltyDisplay: "$5.7M",
    source: "FTC (Feb 2019)",
  },
  {
    id: 2,
    date: "2019-09-04",
    country: "USA", flag: "🇺🇸", region: "Americas",
    entity: "Google LLC / YouTube",
    entityShort: "Google / YouTube",
    regulation: "COPPA",
    actionType: "Civil Penalty + Injunction",
    actionCategory: "Civil Penalty",
    description: "YouTube used persistent identifiers to track viewers on child-directed channels and served them targeted advertising without parental consent, earning ~$50M. Settlement split $136M to FTC, $34M to NY AG. Required YouTube to build a channel-owner content-classification system.",
    penaltyUSD: 170000000,
    penaltyDisplay: "$170M",
    source: "FTC/NY AG (Sep 2019)",
  },
  {
    id: 3,
    date: "2020-09-04",
    country: "USA", flag: "🇺🇸", region: "Americas",
    entity: "Age of Learning (ABCmouse)",
    entityShort: "ABCmouse",
    regulation: "FTC Act / Deceptive Practices",
    actionType: "Civil Penalty",
    actionCategory: "Civil Penalty",
    description: "Children's e-learning app trapped hundreds of thousands of parents in undisclosed auto-renewing subscriptions; failed to clearly disclose renewal terms or provide a simple cancellation mechanism. App marketed directly to families of young children.",
    penaltyUSD: 10000000,
    penaltyDisplay: "$10M",
    source: "FTC (Sep 2020)",
  },
  {
    id: 4,
    date: "2022-03-04",
    country: "USA", flag: "🇺🇸", region: "Americas",
    entity: "Kurbo / WW International (Weight Watchers)",
    entityShort: "WW / Kurbo",
    regulation: "COPPA",
    actionType: "Civil Penalty + Algorithm Deletion",
    actionCategory: "Civil Penalty",
    description: "Weight-loss app for children as young as 8 collected sensitive health data without parental consent. First COPPA case requiring deletion of algorithms trained on unlawfully collected children's data.",
    penaltyUSD: 1500000,
    penaltyDisplay: "$1.5M",
    source: "FTC/DOJ (Mar 2022)",
  },
  {
    id: 5,
    date: "2022-09-05",
    country: "Ireland (EU)", flag: "🇮🇪", region: "Europe",
    entity: "Meta Platforms Ireland (Instagram)",
    entityShort: "Meta / Instagram",
    regulation: "GDPR Arts. 5, 6, 12, 24, 25",
    actionType: "Administrative Fine + Corrective Order",
    actionCategory: "Admin Fine",
    description: "Teen Instagram accounts set to public by default, exposing email addresses and phone numbers globally. Business account feature published children's contact details without adequate safeguards. Second-largest GDPR fine ever at time of issue.",
    penaltyUSD: 432000000,
    penaltyDisplay: "$432M (€405M)",
    source: "Irish DPC (Sep 2022)",
  },
  {
    id: 6,
    date: "2022-12-19",
    country: "USA", flag: "🇺🇸", region: "Americas",
    entity: "Epic Games Inc. (Fortnite)",
    entityShort: "Epic Games",
    regulation: "COPPA + FTC Act (Dark Patterns)",
    actionType: "Civil Penalty + Consumer Refund + Injunction",
    actionCategory: "Civil Penalty",
    description: "Fortnite collected children's data without consent and enabled default voice/text chat pairing minors with strangers. Separately fined $245M for dark patterns targeting minors. Combined $520M — largest gaming privacy settlement and largest COPPA penalty in history.",
    penaltyUSD: 520000000,
    penaltyDisplay: "$520M",
    source: "FTC/DOJ (Dec 2022)",
  },
  {
    id: 7,
    date: "2023-01-12",
    country: "France", flag: "🇫🇷", region: "Europe",
    entity: "TikTok Technology Ltd (CNIL)",
    entityShort: "TikTok (CNIL)",
    regulation: "French Data Protection Act / GDPR",
    actionType: "Administrative Fine",
    actionCategory: "Admin Fine",
    description: "CNIL found TikTok made cookie rejection significantly harder than acceptance (multi-click refusal vs. one-click consent). CNIL cited underage user base as an aggravating factor in the fine calculation.",
    penaltyUSD: 5400000,
    penaltyDisplay: "$5.4M (€5M)",
    source: "CNIL (Jan 2023)",
  },
  {
    id: 8,
    date: "2023-04-04",
    country: "United Kingdom", flag: "🇬🇧", region: "Europe",
    entity: "TikTok Technology Ltd (ICO UK)",
    entityShort: "TikTok (ICO UK)",
    regulation: "UK GDPR / Children's Code",
    actionType: "Administrative Fine + Corrective Order",
    actionCategory: "Admin Fine",
    description: "ICO found TikTok allowed ~1.4M UK children under 13 on the platform contrary to its own terms; failed to obtain parental consent; did not explain data processing in age-appropriate language.",
    penaltyUSD: 15900000,
    penaltyDisplay: "$15.9M (£12.7M)",
    source: "ICO (Apr 2023)",
  },
  {
    id: 9,
    date: "2023-05-22",
    country: "USA", flag: "🇺🇸", region: "Americas",
    entity: "Edmodo LLC (EdTech)",
    entityShort: "Edmodo",
    regulation: "COPPA",
    actionType: "Civil Penalty (suspended) + Permanent Injunction",
    actionCategory: "Suspended",
    description: "EdTech platform serving ~600K under-13 students used children's data for targeted advertising without parental consent. $6M penalty assessed but suspended due to company insolvency. First FTC order prohibiting an EdTech provider from requiring excess data collection.",
    penaltyUSD: null,
    penaltyDisplay: "$6M (suspended)",
    source: "FTC/DOJ (May 2023)",
  },
  {
    id: 10,
    date: "2023-05-31",
    country: "USA", flag: "🇺🇸", region: "Americas",
    entity: "Amazon.com Inc. (Alexa)",
    entityShort: "Amazon Alexa",
    regulation: "COPPA",
    actionType: "Civil Penalty + Injunction",
    actionCategory: "Civil Penalty",
    description: "Amazon retained children's voice recordings and precise geolocation data indefinitely — even after parents explicitly requested deletion — and used recordings to train Alexa AI algorithms. Prohibited from using retained children's data for algorithm training.",
    penaltyUSD: 25000000,
    penaltyDisplay: "$25M",
    source: "FTC/DOJ (May 2023)",
  },
  {
    id: 11,
    date: "2023-06-05",
    country: "USA", flag: "🇺🇸", region: "Americas",
    entity: "Microsoft Corporation (Xbox)",
    entityShort: "Microsoft Xbox",
    regulation: "COPPA",
    actionType: "Civil Penalty + Injunction",
    actionCategory: "Civil Penalty",
    description: "Xbox account creation collected personal data from ~218,000 US children under 13 between 2017–2021 without parental consent or notification. Required to notify game publishers when a user is identified as a child.",
    penaltyUSD: 20000000,
    penaltyDisplay: "$20M",
    source: "FTC/DOJ (Jun 2023)",
  },
  {
    id: 12,
    date: "2023-09-15",
    country: "Ireland (EU)", flag: "🇮🇪", region: "Europe",
    entity: "TikTok Technology Ltd (DPC Ireland)",
    entityShort: "TikTok (DPC)",
    regulation: "GDPR Arts. 5, 12, 13, 24, 25",
    actionType: "Administrative Fine + Corrective Order",
    actionCategory: "Admin Fine",
    description: "Teen accounts (13–17) set public by default; Family Pairing failed to verify genuine parents; dark patterns steered child users toward privacy-intrusive options during registration. EDPB issued binding instruction enforcing the fine.",
    penaltyUSD: 373000000,
    penaltyDisplay: "$373M (€345M)",
    source: "Irish DPC (Sep 2023)",
  },
  {
    id: 13,
    date: "2024-08-02",
    country: "USA", flag: "🇺🇸", region: "Americas",
    entity: "TikTok Inc. / ByteDance Ltd.",
    entityShort: "TikTok (DOJ suit)",
    regulation: "COPPA",
    actionType: "Civil Lawsuit (penalty pending)",
    actionCategory: "Lawsuit",
    description: "DOJ/FTC sued TikTok for knowingly permitting millions of under-13s on the adult platform; built technical backdoors allowing children to bypass age gates. Seeking civil penalties up to $51,744 per violation per day.",
    penaltyUSD: null,
    penaltyDisplay: "Pending",
    source: "DOJ/FTC (Aug 2024)",
  },
  {
    id: 14,
    date: "2024-12-20",
    country: "Italy (EU)", flag: "🇮🇹", region: "Europe",
    entity: "OpenAI (ChatGPT)",
    entityShort: "OpenAI Italy",
    regulation: "GDPR Arts. 5, 6, 13, 25, 33",
    actionType: "Administrative Fine + Public Education Order",
    actionCategory: "Admin Fine",
    description: "No age verification for minors under 13; exposed children to potentially age-inappropriate AI-generated content; processed personal data for AI training without adequate legal basis; failed to notify Garante of a March 2023 data breach. Required to run a 6-month public AI literacy campaign.",
    penaltyUSD: 15600000,
    penaltyDisplay: "$15.6M (€15M)",
    source: "Garante Italy (Dec 2024)",
  },
  {
    id: 15,
    date: "2025-01-20",
    country: "USA", flag: "🇺🇸", region: "Americas",
    entity: "Cognosphere / HoYoverse (Genshin Impact)",
    entityShort: "HoYoverse",
    regulation: "COPPA",
    actionType: "Civil Penalty + Injunction",
    actionCategory: "Civil Penalty",
    description: "Singapore/China developer actively marketed Genshin Impact to children and collected personal data without parental consent; deceived players including minors about loot box prize odds. Banned from selling loot boxes to under-16s without parental consent.",
    penaltyUSD: 20000000,
    penaltyDisplay: "$20M",
    source: "FTC (Jan 2025)",
  },
];

// Enforcement chart colours by enforcement jurisdiction
const ENFORCEMENT_COLORS = {
  "USA":            "#3B82F6",  // blue
  "Ireland (EU)":   "#6366F1",  // indigo
  "United Kingdom": "#7C3AED",  // violet
  "France":         "#EC4899",  // pink
  "Italy (EU)":     "#F43F5E",  // rose
};

// Action badge styles
const ACTION_BADGE_STYLES = {
  "Civil Penalty": { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  "Admin Fine":    { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-200"    },
  "Lawsuit":       { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-200"  },
  "Suspended":     { bg: "bg-slate-100",  text: "text-slate-500",  border: "border-slate-200"  },
};

// ─────────────────────────────────────────────────────────────────────────────
// REGIONAL MOMENTUM — sub-region groupings + display meta
// ─────────────────────────────────────────────────────────────────────────────
const SUBREGION_MAP = {
  // North America
  "US":    "North America",
  "US-CA": "North America",
  "CA":    "North America",
  // Europe
  "GB":    "Europe",
  "EU":    "Europe",
  "FR":    "Europe",
  "DE":    "Europe",
  "IE":    "Europe",
  "TR":    "Europe",
  // Latin America
  "BR":    "Latin America",
  "AR":    "Latin America",
  "MX":    "Latin America",
  // Asia-Pacific
  "AU":    "Asia-Pacific",
  "KR":    "Asia-Pacific",
  "JP":    "Asia-Pacific",
  "CN":    "Asia-Pacific",
  "IN":    "Asia-Pacific",
  "SG":    "Asia-Pacific",
  "ID":    "Asia-Pacific",
  // Middle East
  "SA":    "Middle East",
  "AE":    "Middle East",
  "IL":    "Middle East",
  // Africa
  "ZA":    "Africa",
  "NG":    "Africa",
  "KE":    "Africa",
};

// Display order, accent color, and 1-line regional summary
const SUBREGION_META = {
  "North America": {
    color:   "#3B82F6",
    icon:    "🌎",
    summary: "COPPA 2.0 & CA AADC pending — most active rulemaking globally right now",
  },
  "Europe": {
    color:   "#6366F1",
    icon:    "🌍",
    summary: "All 7 frameworks enforced — highest average risk score of any region (8.1)",
  },
  "Asia-Pacific": {
    color:   "#0EA5E9",
    icon:    "🌏",
    summary: "India's DPDP Act rules still pending; China leads enforcement volume",
  },
  "Middle East": {
    color:   "#F59E0B",
    icon:    "🕌",
    summary: "UAE Child Safety Law just entered force Jan 2026; IL Amendment 13 active",
  },
  "Latin America": {
    color:   "#10B981",
    icon:    "🌿",
    summary: "Brazil's Digital ECA (2025) sets the highest regional penalties at R$50M",
  },
  "Africa": {
    color:   "#F43F5E",
    icon:    "🌍",
    summary: "Frameworks enacted across all three jurisdictions; enforcement capacity building",
  },
};

const SUBREGION_ORDER = [
  "North America", "Europe", "Asia-Pacific", "Middle East", "Latin America", "Africa",
];

// ─────────────────────────────────────────────────────────────────────────────
// AI INTELLIGENCE BRIEFS — data
// ─────────────────────────────────────────────────────────────────────────────
const REGIONAL_BRIEFS = {
  "North America": {
    sentences: [
      "North America presents the most volatile regulatory cycle globally: COPPA 2.0 seeks to extend consent obligations to all users under 17, tripling the protected population, while the FTC has demonstrated sustained enforcement velocity with $598.7M levied across 9 actions since 2019 — including the $520M Epic Games settlement that set the ceiling for non-compliance liability.",
      "California's AADC, though currently enjoined, remains a bellwether: if the 9th Circuit upholds enforcement, design-code obligations requiring mandatory DPIAs and privacy-by-default will propagate rapidly across other US state legislatures, creating a patchwork regime with higher aggregate compliance cost than federal law alone.",
      "Organisations operating across this region should treat COPPA 2.0 enactment as near-certain, initiate under-17 consent-flow gap analysis immediately, and monitor the NetChoice v. Bonta appellate decision as the single highest-impact upcoming binary trigger for North American regulatory exposure.",
    ],
    riskLevel: "High",
    riskColor: "#E24B4A",
    highlight: "$598.7M enforced · 2 laws pending",
  },
  "Europe": {
    sentences: [
      "Europe operates the world's most enforcement-active child data protection stack: seven frameworks are simultaneously in force, the Irish DPC alone has issued $805M in children's data fines — making it the single highest-penalty enforcement jurisdiction in this dataset — and TikTok's €530M DSA fine (April 2025) confirms the European Commission will deploy its maximum authority against non-compliant platforms.",
      "The regulatory architecture is now layered: GDPR Article 8 governs consent, DSA Article 28 governs algorithmic profiling and VLOP risk assessments, and national codes (UK Children's Code, France's SREN, Germany's JuSchG) create jurisdiction-specific operational obligations on top — particularly around age verification technology standards that vary by member state.",
      "The material tail risk in this region is cross-border enforcement multiplier effect: Ireland's one-stop-shop lead supervisor role means a single DPC investigation creates binding EU-wide remediation, and the EDPB's binding instruction mechanism — used in both the Meta and TikTok cases — signals that national DPA disagreements will consistently be resolved in favour of higher penalties.",
    ],
    riskLevel: "Critical",
    riskColor: "#E24B4A",
    highlight: "$805M DPC fines · all 7 frameworks enforced",
  },
  "Asia-Pacific": {
    sentences: [
      "Asia-Pacific is the most structurally complex region to model: eight distinct frameworks span seven jurisdictions, with China's Minors Cyberspace Regulation mandating the world's most prescriptive operational constraints (screen-time caps, 10pm–6am service blackouts, algorithm prohibition) while India's DPDP Act — enacted August 2023 — remains in a pre-enforcement limbo pending Board constitution and implementing rules expected mid-2026.",
      "China represents the highest-volume enforcement environment in the region; Didi's $1.18B PIPL fine and the removal of 168 non-compliant apps in Q1 2024 under the Minors Regulation demonstrate the CAC's willingness to act at scale, and any platform with Chinese user data should model both the PIPL sensitive-data regime and the minor-mode technical compliance obligations as concurrent, not sequential, priorities.",
      "India's DPDP Act, once operational, will instantly create compliance obligations for platforms serving one of the world's largest under-18 user populations; given that parental consent verification for all under-18s is mandatory and behavioural advertising to minors is a categorical prohibition, the activation event should be treated as Tier-1 incident-response preparation rather than routine compliance planning.",
    ],
    riskLevel: "High",
    riskColor: "#E24B4A",
    highlight: "8 frameworks · India DPDP pending",
  },
  "Middle East": {
    sentences: [
      "The Middle East has undergone a compressed regulatory build-out: Saudi Arabia's PDPL entered full enforcement in September 2023, Israel's Amendment 13 introduced significant monetary penalties effective 2025, and the UAE's Federal Decree-Law No. 26 on Child Digital Safety entered force January 2026 — all three within a 28-month window, representing one of the fastest regional framework deployments in this dataset.",
      "Current risk scores are moderated by limited public enforcement history, but SDAIA's registration programme, the UAE TDRA's inaugural compliance audit cycle (underway Q1 2026), and Israel's PPA guidance on children's data collectively signal that the enforcement ramp-up phase is active rather than hypothetical, and first-mover fines are likely to be calibrated for deterrence rather than proportionality.",
      "Companies with Gulf-region operations should prioritise UAE compliance — the law's provisions uniquely mandate CSAM reporting, prohibit commercialisation of children's data, and impose content-blocking defaults that require technical implementation work distinct from policy-layer GDPR compliance — and should complete SDAIA controller registration immediately to avoid regulatory flag status.",
    ],
    riskLevel: "Medium",
    riskColor: "#EF9F27",
    highlight: "3 frameworks enforced · UAE law Jan 2026",
  },
  "Latin America": {
    sentences: [
      "Latin America's regulatory landscape is anchored by Brazil, which has constructed the region's most comprehensive child data protection regime: LGPD classifies children's data as sensitive, requiring specific highlighted parental consent, while the Digital ECA (in force January 2025) adds an absolute prohibition on behavioural advertising to under-18s and the region's highest penalty ceiling at 10% of Brazilian annual revenue or R$50M — whichever is greater.",
      "Argentina's Law 25.326, dating from 2000, remains the weakest framework in the full dataset with a nominal ARS 3,000 fine cap, though a reform bill proposing penalties up to ARS 200M is pending congressional approval; Mexico faces a structural enforcement continuity risk following INAI's dissolution in May 2025 and transfer of responsibilities to the nascent SABG, creating a regulatory gap that could persist through 2026.",
      "Brazil should be treated as a Tier-1 compliance priority equivalent to the European Union: ANPD's first fine (August 2023) and the 12-month Digital ECA compliance window expiring January 2026 create a convergent enforcement activation timeline, and platforms that have not completed Digital ECA gap analysis — particularly around age verification architecture and under-16 account-linking to parental accounts — should escalate this as an immediate programme priority.",
    ],
    riskLevel: "Medium",
    riskColor: "#EF9F27",
    highlight: "Digital ECA active Jan 2025 · R$50M cap",
  },
  "Africa": {
    sentences: [
      "Africa's three covered jurisdictions — South Africa, Nigeria, and Kenya — have each enacted comprehensive data protection frameworks with explicit children's provisions, but enforcement maturity varies significantly: South Africa's Information Regulator has issued enforcement notices and a ZAR 5M fine, while Nigeria's NDPC and Kenya's ODPC remain in early-stage enforcement capacity building with their first major digital platform investigations now underway.",
      "The regional risk profile is asymmetric: near-term operational compliance costs are moderate, but first-mover enforcement risk is elevated because regulators in all three jurisdictions are actively seeking high-profile cases to establish deterrence — NDPC's 2024 fintech audit cycle and the Information Regulator's inaugural social-media children's investigation both demonstrate investigative intent that is outpacing current risk scores.",
      "Organisations should not interpret low historical penalty totals as low structural risk: South Africa's POPIA authorises fines up to ZAR 10M plus criminal imprisonment, Nigeria's 2% of gross revenue exposure scales significantly for large platforms, and Kenya's Bill of Rights-grounded data protection framework creates constitutional-level protections that courts have shown willingness to enforce — a legal dynamic absent from most other regions in this dataset.",
    ],
    riskLevel: "Low-Medium",
    riskColor: "#5DCAA5",
    highlight: "3 frameworks enforced · enforcement building",
  },
};

const METHODOLOGY_FACTORS = [
  {
    label: "Enforcement Frequency",
    weight: 30,
    color: "#3B82F6",
    desc: "Historical count and regularity of regulatory actions, investigations, and fines issued against platforms in the jurisdiction.",
  },
  {
    label: "Penalty Severity",
    weight: 25,
    color: "#E24B4A",
    desc: "Maximum statutory fine ceiling relative to global revenue, plus median penalty size from historical enforcement record.",
  },
  {
    label: "Regulatory Momentum",
    weight: 25,
    color: "#EF9F27",
    desc: "Pending legislation, regulatory amendments, enforcement ramp-up signals, and pipeline of active investigations.",
  },
  {
    label: "Regulatory Scope",
    weight: 20,
    color: "#5DCAA5",
    desc: "Population covered, age threshold breadth, applies-to definition, and cross-border jurisdictional reach.",
  },
];

const WORKFLOW_STEPS = [
  {
    icon: "📡",
    title: "Regulatory Sources",
    desc: "29 frameworks monitored across 25 jurisdictions",
    color: "#3B82F6",
  },
  {
    icon: "⚙️",
    title: "Data Ingestion",
    desc: "Structured extraction of penalty, scope and status fields",
    color: "#6366F1",
  },
  {
    icon: "🧠",
    title: "AI Analysis",
    desc: "NLP-assisted parsing of enforcement actions and amendments",
    color: "#8B5CF6",
  },
  {
    icon: "📊",
    title: "Risk Scoring",
    desc: "Weighted composite model across 4 scoring dimensions",
    color: "#EF9F27",
  },
  {
    icon: "📋",
    title: "Executive Brief",
    desc: "Region-level intelligence synthesised for decision-makers",
    color: "#5DCAA5",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAP CONSTANTS — ISO 3166-1 numeric IDs
// ─────────────────────────────────────────────────────────────────────────────
const EU_MEMBER_IDS = [
  40, 56, 100, 196, 203, 208, 233, 246, 250, 276,
  300, 191, 348, 372, 380, 440, 442, 428, 470, 528,
  616, 620, 642, 703, 705, 724, 752,
];

const ALPHA2_TO_NUMERIC = {
  "US": 840, "US-CA": 840, "GB": 826, "FR": 250, "DE": 276, "IE": 372,
  "CA": 124, "BR": 76,  "AR": 32,  "MX": 484, "AU": 36,  "KR": 410,
  "JP": 392, "CN": 156, "IN": 356, "SG": 702, "ID": 360, "SA": 682,
  "AE": 784, "ZA": 710, "NG": 566, "KE": 404, "TR": 792, "IL": 376,
};

// ─────────────────────────────────────────────────────────────────────────────
// FILTER OPTIONS
// ─────────────────────────────────────────────────────────────────────────────
const REGIONS  = ["All Regions",  "Americas", "Europe", "Asia-Pacific", "Middle East & Africa"];
const STATUSES = ["All Statuses", "enforced", "pending", "proposed"];

const STATUS_STYLES = {
  enforced: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  pending:  "bg-amber-100  text-amber-800  border border-amber-200",
  proposed: "bg-sky-100    text-sky-800    border border-sky-200",
};
const STATUS_DOT = {
  enforced: "bg-emerald-500",
  pending:  "bg-amber-400",
  proposed: "bg-sky-400",
};

// ─────────────────────────────────────────────────────────────────────────────
// COLOUR HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function getRiskFill(score) {
  if (score >= 8) return "#E24B4A";
  if (score >= 5) return "#EF9F27";
  if (score >= 2) return "#5DCAA5";
  return "#94a3b8";
}
function getRiskTextClass(score) {
  if (score >= 8) return "text-red-500";
  if (score >= 5) return "text-amber-500";
  return "text-teal-500";
}
function getRiskBgClass(score) {
  if (score >= 8) return "bg-red-400";
  if (score >= 5) return "bg-amber-400";
  return "bg-teal-400";
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG / MAP CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const SVG_W = 960;
const SVG_H = 500;
const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ─────────────────────────────────────────────────────────────────────────────
// METRIC CARD
// ─────────────────────────────────────────────────────────────────────────────
function MetricCard({ label, value, icon, valueClass }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <span className={`text-4xl font-bold ${valueClass ?? "text-slate-700"}`}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WORLD MAP
// ─────────────────────────────────────────────────────────────────────────────
function WorldMap({ countryRiskMap, worldData }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (!worldData || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const projection = d3.geoNaturalEarth1().scale(153).translate([SVG_W / 2, SVG_H / 2]);
    const pathGen = d3.geoPath().projection(projection);

    svg.append("path").datum({ type: "Sphere" }).attr("d", pathGen).attr("fill", "#0c1524");
    svg.append("path").datum(d3.geoGraticule()()).attr("d", pathGen)
      .attr("fill", "none").attr("stroke", "#162032").attr("stroke-width", 0.4);

    const countries = topojson.feature(worldData, worldData.objects.countries);
    svg.selectAll("path.country").data(countries.features).join("path")
      .attr("class", "country").attr("d", pathGen)
      .attr("fill", d => { const info = countryRiskMap[+d.id]; return info ? getRiskFill(info.riskScore) : "#1e293b"; })
      .attr("stroke", "#0f172a").attr("stroke-width", 0.35)
      .style("cursor", d => (countryRiskMap[+d.id] ? "pointer" : "default"))
      .on("mouseover", function (event, d) {
        const info = countryRiskMap[+d.id];
        if (!info) return;
        d3.select(this).raise().attr("stroke", "#fff").attr("stroke-width", 1.5).style("opacity", 0.88);
        const [sx, sy] = d3.pointer(event, svgRef.current);
        setTooltip({ sx, sy, ...info });
      })
      .on("mousemove", function (event, d) {
        if (!countryRiskMap[+d.id]) return;
        const [sx, sy] = d3.pointer(event, svgRef.current);
        setTooltip(prev => (prev ? { ...prev, sx, sy } : null));
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", "#0f172a").attr("stroke-width", 0.35).style("opacity", 1);
        setTooltip(null);
      });

    svg.append("path")
      .datum(topojson.mesh(worldData, worldData.objects.countries, (a, b) => a !== b))
      .attr("d", pathGen).attr("fill", "none").attr("stroke", "#0f172a")
      .attr("stroke-width", 0.3).attr("pointer-events", "none");
  }, [worldData, countryRiskMap]);

  const ttStyle = tooltip ? {
    position: "absolute",
    left: `${(tooltip.sx / SVG_W) * 100}%`,
    top: `${(tooltip.sy / SVG_H) * 100}%`,
    transform: "translate(14px, -50%)",
    pointerEvents: "none",
    zIndex: 30,
  } : null;

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ background: "#0c1524" }}>
      <svg ref={svgRef} viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: "100%", height: "auto", display: "block" }} />
      {tooltip && (
        <div style={ttStyle}
          className="bg-slate-800/95 border border-slate-600 rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-sm whitespace-nowrap">
          <p className="text-white font-semibold text-sm leading-tight">{tooltip.country}</p>
          <p className="text-slate-400 text-xs mt-0.5">{tooltip.shortName}</p>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
            <span className="text-slate-400 text-xs">Risk</span>
            <span className="font-bold text-sm" style={{ color: getRiskFill(tooltip.riskScore) }}>
              {tooltip.riskScore}<span className="text-slate-500 font-normal text-xs"> / 10</span>
            </span>
            <div className="flex gap-0.5 ml-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-1.5 h-2 rounded-sm"
                  style={{ background: i < tooltip.riskScore ? getRiskFill(tooltip.riskScore) : "#334155" }} />
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="absolute bottom-3 left-4 flex items-center gap-3 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-slate-700/60">
        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Risk</span>
        {[
          { label: "High (8–10)", color: "#E24B4A" },
          { label: "Med (5–7)",   color: "#EF9F27" },
          { label: "Low (2–4)",   color: "#5DCAA5" },
          { label: "No data",     color: "#1e293b", border: "1px solid #334155" },
        ].map(({ label, color, border }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ background: color, border: border ?? "none" }} />
            <span className="text-slate-400 text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTRY CARD
// ─────────────────────────────────────────────────────────────────────────────
function CountryCard({ reg }) {
  const [open, setOpen] = useState(false);
  const requirements = reg.keyRequirements.split(";").map(s => s.trim()).filter(Boolean);
  const flag = FLAGS[reg.countryCode] ?? "🌐";

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden transition-shadow duration-200"
      style={{
        borderLeft: `4px solid ${getRiskFill(reg.riskScore)}`,
        boxShadow: open
          ? "0 8px 30px rgba(0,0,0,0.12)"
          : "0 1px 4px rgba(0,0,0,0.06)",
        border: `1px solid ${open ? "#e2e8f0" : "#f1f5f9"}`,
        borderLeft: `4px solid ${getRiskFill(reg.riskScore)}`,
      }}
    >
      {/* ── Clickable header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-5 pt-5 pb-4 hover:bg-slate-50/70 transition-colors focus:outline-none"
      >
        {/* Row 1: flag + country + status + chevron */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-2xl leading-none flex-shrink-0 mt-0.5">{flag}</span>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 text-sm leading-tight truncate">{reg.country}</p>
              <p className="text-slate-500 text-xs font-semibold mt-0.5">{reg.shortName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[reg.status] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[reg.status] ?? "bg-slate-400"}`} />
              {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
            </span>
            <span
              className="text-slate-400 text-xs flex-shrink-0 transition-transform duration-250"
              style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }}
            >
              ▾
            </span>
          </div>
        </div>

        {/* Risk bar */}
        <div className="flex items-center gap-2.5 mt-3.5">
          <span className="text-slate-400 text-xs w-7 flex-shrink-0">Risk</span>
          <div className="flex gap-0.5 flex-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}
                className={`h-2 flex-1 rounded-sm transition-colors ${i < reg.riskScore ? getRiskBgClass(reg.riskScore) : "bg-slate-200"}`} />
            ))}
          </div>
          <span className={`text-sm font-bold w-5 text-right flex-shrink-0 ${getRiskTextClass(reg.riskScore)}`}>
            {reg.riskScore}
          </span>
        </div>

        {/* Meta row: max penalty + enforcement body */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
            <span className="flex-shrink-0">💰</span>
            <span className="truncate max-w-52">{reg.maxPenalty}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
            <span className="flex-shrink-0">🏛</span>
            <span className="truncate max-w-52">{reg.enforcementBody}</span>
          </div>
        </div>
      </button>

      {/* ── Expandable body — CSS grid trick for smooth animation ── */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.28s ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div className="px-5 pb-5 pt-1 border-t border-slate-100">

            {/* Key Requirements */}
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Key Requirements
              </p>
              <ul className="space-y-2">
                {requirements.map((req, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-slate-600 leading-relaxed">
                    <span
                      className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
                      style={{ background: getRiskFill(reg.riskScore), minWidth: "1rem" }}
                    >
                      {i + 1}
                    </span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent Enforcement */}
            {reg.recentEnforcement && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Recent Enforcement
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">{reg.recentEnforcement}</p>
              </div>
            )}

            {/* Effective Date */}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <span>📅</span>
              <span>Effective: {reg.effectiveDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REGIONAL MOMENTUM CARDS
// ─────────────────────────────────────────────────────────────────────────────
function RegionalMomentumCards() {
  // Compute enforced / pending counts per sub-region from the full REGULATIONS array
  const subregions = useMemo(() => {
    const stats = {};
    for (const reg of REGULATIONS) {
      const sub = SUBREGION_MAP[reg.countryCode];
      if (!sub) continue;
      if (!stats[sub]) stats[sub] = { enforced: 0, pending: 0, proposed: 0, total: 0 };
      stats[sub].total++;
      if (reg.status === "enforced") stats[sub].enforced++;
      else if (reg.status === "pending")  stats[sub].pending++;
      else if (reg.status === "proposed") stats[sub].proposed++;
    }
    return SUBREGION_ORDER.map(name => ({
      name,
      ...SUBREGION_META[name],
      enforced: stats[name]?.enforced  ?? 0,
      pending:  stats[name]?.pending   ?? 0,
      proposed: stats[name]?.proposed  ?? 0,
      total:    stats[name]?.total     ?? 0,
    }));
  }, []);   // REGULATIONS is a module-level const — safe to compute once

  // Trend arrow: ↑ rising (pending > 2), → active (1–2), ↓ stable (0)
  const trend = (pending) => {
    if (pending > 2)  return { arrow: "↑", label: "Rising",  cls: "text-amber-400" };
    if (pending >= 1) return { arrow: "→", label: "Active",  cls: "text-blue-400"  };
    return               { arrow: "↓", label: "Stable",  cls: "text-emerald-400" };
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {subregions.map(r => {
        const t = trend(r.pending);
        return (
          <div
            key={r.name}
            className="bg-slate-800 rounded-2xl border border-slate-700/60 p-4 flex flex-col gap-3"
            style={{ borderTop: `3px solid ${r.color}` }}
          >
            {/* Header row: icon + name + trend arrow */}
            <div className="flex items-start justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base leading-none flex-shrink-0">{r.icon}</span>
                <p className="text-white font-bold text-xs leading-tight">{r.name}</p>
              </div>
              <div className="flex flex-col items-center flex-shrink-0 -mt-0.5">
                <span className={`text-lg font-black leading-none ${t.cls}`}>{t.arrow}</span>
                <span className={`text-[9px] font-semibold uppercase tracking-wide mt-0.5 ${t.cls}`}>{t.label}</span>
              </div>
            </div>

            {/* Counts */}
            <div className="flex gap-4">
              <div>
                <p className="text-emerald-400 font-extrabold text-2xl leading-none tabular-nums">{r.enforced}</p>
                <p className="text-slate-500 text-[10px] mt-0.5 font-medium uppercase tracking-wide">enforced</p>
              </div>
              <div>
                <p className={`font-extrabold text-2xl leading-none tabular-nums ${r.pending > 0 ? "text-amber-400" : "text-slate-600"}`}>
                  {r.pending}
                </p>
                <p className="text-slate-500 text-[10px] mt-0.5 font-medium uppercase tracking-wide">pending</p>
              </div>
            </div>

            {/* 1-line summary */}
            <p className="text-slate-400 text-[11px] leading-relaxed">{r.summary}</p>

            {/* Mini progress bar: enforced / total */}
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: r.total > 0 ? `${(r.enforced / r.total) * 100}%` : "0%",
                  background: r.color,
                }}
              />
            </div>
            <p className="text-slate-600 text-[10px] -mt-1.5">
              {r.enforced}/{r.total} enforced
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI INTELLIGENCE BRIEFS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function AiIntelligenceBriefs() {
  const [openBrief, setOpenBrief] = useState(null);

  return (
    <div className="space-y-8">

      {/* ── Workflow diagram ─────────────────────────────────────────────── */}
      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">
          Intelligence Pipeline
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-0 overflow-x-auto pb-2">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={step.title} className="flex flex-col sm:flex-row items-center flex-shrink-0">
              {/* Step node */}
              <div className="flex flex-col items-center text-center w-40 px-2">
                {/* Icon circle */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2 flex-shrink-0"
                  style={{ background: `${step.color}22`, border: `2px solid ${step.color}` }}
                >
                  {step.icon}
                </div>
                {/* Step number + title */}
                <div
                  className="text-[10px] font-black uppercase tracking-widest mb-0.5"
                  style={{ color: step.color }}
                >
                  {`0${i + 1}`}
                </div>
                <p className="text-white font-semibold text-xs leading-tight mb-1">{step.title}</p>
                <p className="text-slate-500 text-[10px] leading-relaxed">{step.desc}</p>
              </div>

              {/* Arrow connector (not after last step) */}
              {i < WORKFLOW_STEPS.length - 1 && (
                <div className="flex flex-col sm:flex-row items-center mx-1 my-2 sm:my-0">
                  {/* Vertical line on mobile, horizontal on sm+ */}
                  <div className="w-px h-6 sm:hidden bg-slate-700" />
                  <div className="hidden sm:flex items-center gap-0.5">
                    <div className="w-8 h-px bg-slate-600" />
                    <div
                      className="text-slate-500 text-xs font-bold"
                      style={{ lineHeight: 1 }}
                    >
                      ›
                    </div>
                  </div>
                  <div className="sm:hidden text-slate-600 text-xs">↓</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Methodology panel ────────────────────────────────────────────── */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Left: description */}
          <div className="sm:w-64 flex-shrink-0">
            <p className="text-white font-bold text-sm mb-2">Scoring Methodology</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Each regulation's risk score (1–10) is a weighted composite across four dimensions.
              Scores are calibrated against observed enforcement outcomes and updated as new actions are recorded.
            </p>
            <div className="mt-4 flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-700/60">
              <span className="text-base">🧮</span>
              <p className="text-slate-400 text-[11px] leading-snug">
                <span className="text-white font-semibold">Formula: </span>
                (EF×0.30) + (PS×0.25) + (RM×0.25) + (RS×0.20)
              </p>
            </div>
          </div>

          {/* Right: factor bars */}
          <div className="flex-1 space-y-4">
            {METHODOLOGY_FACTORS.map(f => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: f.color }} />
                    <span className="text-slate-200 text-xs font-semibold">{f.label}</span>
                  </div>
                  <span className="font-black text-sm tabular-nums" style={{ color: f.color }}>
                    {f.weight}%
                  </span>
                </div>
                {/* Weight bar */}
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${f.weight}%`, background: f.color }}
                  />
                </div>
                <p className="text-slate-500 text-[10px] mt-1 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Regional brief cards ─────────────────────────────────────────── */}
      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">
          Executive Risk Briefs — AI Generated from Regulatory Dataset
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUBREGION_ORDER.map(regionName => {
            const brief   = REGIONAL_BRIEFS[regionName];
            const meta    = SUBREGION_META[regionName];
            const isOpen  = openBrief === regionName;
            if (!brief) return null;
            return (
              <div
                key={regionName}
                className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden flex flex-col"
                style={{ borderTop: `3px solid ${meta.color}` }}
              >
                {/* Card header */}
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl flex-shrink-0">{meta.icon}</span>
                      <div>
                        <p className="text-white font-bold text-sm leading-tight">{regionName}</p>
                        <p className="text-xs mt-0.5" style={{ color: meta.color }}>{brief.highlight}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      {/* AI badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-violet-900/60 text-violet-300 border border-violet-700/60">
                        🤖 AI BRIEF
                      </span>
                      {/* Risk level badge */}
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: `${brief.riskColor}22`, color: brief.riskColor, border: `1px solid ${brief.riskColor}44` }}
                      >
                        {brief.riskLevel} Risk
                      </span>
                    </div>
                  </div>

                  {/* First sentence always visible */}
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {brief.sentences[0]}
                  </p>
                </div>

                {/* Expandable sentences 2 + 3 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    transition: "grid-template-rows 0.28s ease",
                  }}
                >
                  <div style={{ overflow: "hidden" }}>
                    <div className="px-5 pb-1 space-y-3">
                      {brief.sentences.slice(1).map((s, i) => (
                        <p key={i} className="text-slate-400 text-xs leading-relaxed border-t border-slate-700 pt-3">
                          {s}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer: expand/collapse toggle */}
                <button
                  onClick={() => setOpenBrief(isOpen ? null : regionName)}
                  className="mt-auto mx-5 mb-4 flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
                  style={{ color: meta.color }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s ease",
                    }}
                  >
                    ▾
                  </span>
                  {isOpen ? "Show less" : "Read full brief"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <p className="text-slate-600 text-[10px] mt-4 leading-relaxed">
          ⚠ AI-generated intelligence briefs are synthesised from the regulatory dataset in this dashboard and are intended for directional analysis only.
          They do not constitute legal advice. Verify all cited figures against primary sources before making compliance decisions.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
function fmtMillions(usd) {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(2)}B`;
  if (usd >= 1_000_000)     return `$${(usd / 1_000_000).toFixed(1)}M`;
  return `$${(usd / 1_000).toFixed(0)}K`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENFORCEMENT BAR CHART  — top 10 fines, coloured by enforcement jurisdiction
// ─────────────────────────────────────────────────────────────────────────────
function EnforcementBarChart() {
  const chartData = useMemo(() =>
    ENFORCEMENT_ACTIONS
      .filter(d => typeof d.penaltyUSD === "number")
      .sort((a, b) => b.penaltyUSD - a.penaltyUSD)
      .slice(0, 10)
      .map(d => ({
        name:    d.entityShort,
        value:   +(d.penaltyUSD / 1_000_000).toFixed(1),
        country: d.country,
        color:   ENFORCEMENT_COLORS[d.country] ?? "#64748b",
        display: d.penaltyDisplay,
      }))
      .reverse(),   // recharts layout="vertical" renders array top→bottom; reverse for highest at top
  []);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-xl px-3.5 py-2.5 shadow-xl text-xs">
        <p className="text-white font-semibold">{d.name}</p>
        <p className="text-slate-400 mt-0.5">{d.country}</p>
        <p className="mt-1" style={{ color: d.color }}>
          <span className="font-bold text-sm">{d.display}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-slate-700 font-bold text-sm">Top 10 Largest Penalties</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {Object.entries(ENFORCEMENT_COLORS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: v }} />
              <span className="text-slate-500 text-xs">{k}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-slate-400 text-xs mb-4">USD equivalent at prevailing rate · excludes pending/suspended</p>
      <div className="overflow-x-auto -mx-1">
      <div style={{ minWidth: 320 }}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="vertical"
          margin={{ top: 2, right: 50, bottom: 2, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis
            type="number"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickFormatter={v => `$${v}M`}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fill: "#475569", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Bar dataKey="value" radius={[0, 5, 5, 0]} maxBarSize={22}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ENFORCEMENT TIMELINE  — 10 most recent events
// ─────────────────────────────────────────────────────────────────────────────
function EnforcementTimeline() {
  const recent = useMemo(() =>
    [...ENFORCEMENT_ACTIONS]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10),
  []);

  return (
    <div className="space-y-3">
      {recent.map(item => {
        const badge = ACTION_BADGE_STYLES[item.actionCategory] ?? ACTION_BADGE_STYLES["Civil Penalty"];
        const isPending = item.penaltyUSD === null;
        return (
          <div key={item.id}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5">

            {/* Top row: flag + date + entity + badge + penalty */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center flex-shrink-0 w-10 text-center">
                <span className="text-xl leading-none">{item.flag}</span>
                <span className="text-slate-500 text-[10px] leading-tight mt-0.5">{fmtDate(item.date)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="font-bold text-slate-800 text-sm leading-tight">{item.entityShort ?? item.entity}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                    {item.actionCategory}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">{item.regulation} · {item.source}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className={`font-bold text-sm leading-tight ${isPending ? "text-amber-500" : "text-red-500"}`}>
                  {item.penaltyDisplay}
                </p>
              </div>
            </div>
            {/* Description — full width below */}
            <p className="text-slate-500 text-xs leading-relaxed mt-2 ml-13"
              style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginLeft: "52px" }}>
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ABOUT SECTION
// ─────────────────────────────────────────────────────────────────────────────
function AboutSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-xs font-semibold uppercase tracking-widest transition-colors"
        aria-expanded={open}
      >
        <span className="text-base">ℹ️</span>
        About This Project
        <span className="ml-1 text-slate-600 font-normal normal-case text-xs">
          {open ? "▲ collapse" : "▼ expand"}
        </span>
      </button>

      <div style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 0.3s ease",
      }}>
        <div style={{ overflow: "hidden" }}>
          <div className="mt-4 bg-slate-800 border border-slate-700 rounded-2xl px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            <div>
              <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                <span>🎯</span> Project Purpose
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                This dashboard is a <span className="text-slate-200 font-medium">portfolio project</span> demonstrating Business Intelligence skills
                applied to the global child safety and digital privacy regulatory landscape. It aggregates 29 real-world
                regulations across North America, Europe, Asia-Pacific, the Middle East, Latin America, and Africa — mapping
                enforcement status, risk exposure, and legislative momentum in a single interactive interface.
              </p>
            </div>

            <div>
              <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                <span>🛠️</span> Technical Stack
              </h3>
              <ul className="text-slate-400 text-xs leading-relaxed space-y-1">
                <li><span className="text-blue-400 font-semibold">React</span> — component architecture, hooks (useState, useMemo, useEffect, useRef)</li>
                <li><span className="text-orange-400 font-semibold">D3.js v7</span> — geoNaturalEarth1 world map, TopoJSON country rendering, SVG tooltip</li>
                <li><span className="text-emerald-400 font-semibold">Recharts</span> — responsive horizontal bar chart for enforcement fines</li>
                <li><span className="text-violet-400 font-semibold">Tailwind CSS</span> — dark slate design system, responsive grid breakpoints</li>
                <li><span className="text-pink-400 font-semibold">AI-assisted analysis</span> — regional risk briefs generated via LLM and grounded in regulatory data</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                <span>📌</span> Data & Methodology
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Regulatory data sourced from official government publications, legal databases, and authoritative policy
                trackers. Risk scores are computed using a weighted model: enforcement frequency (30%), penalty severity (25%),
                regulatory momentum (25%), and scope (20%). Enforcement action financials verified via FTC, DPC, ICO, and EU
                DPA press releases. Data snapshot: <span className="text-slate-200 font-medium">May 2025</span>.
              </p>
              <p className="text-slate-500 text-xs mt-3 italic">
                Built by <span className="text-slate-300 not-italic font-semibold">Garima</span> · For professional demonstration purposes only · Not legal advice.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ComplianceDashboard() {
  const [region,    setRegion]    = useState("All Regions");
  const [status,    setStatus]    = useState("All Statuses");
  const [minRisk,   setMinRisk]   = useState(1);
  const [worldData, setWorldData] = useState(null);
  const [mapError,  setMapError]  = useState(false);

  // Fetch world atlas once
  useEffect(() => {
    fetch(WORLD_URL)
      .then(r => { if (!r.ok) throw new Error("fetch failed"); return r.json(); })
      .then(setWorldData)
      .catch(() => setMapError(true));
  }, []);

  // Summary counts (unfiltered)
  const totalCount    = REGULATIONS.length;
  const enforcedCount = REGULATIONS.filter(r => r.status === "enforced").length;
  const highRiskCount = REGULATIONS.filter(r => r.riskScore >= 7).length;
  const pendingCount  = REGULATIONS.filter(r => r.status === "pending").length;

  // Filtered + sorted by risk desc — drives both map and cards
  const filtered = useMemo(() => REGULATIONS.filter(r => {
    if (region !== "All Regions"  && r.region  !== region)  return false;
    if (status !== "All Statuses" && r.status  !== status)  return false;
    if (r.riskScore < minRisk)                               return false;
    return true;
  }), [region, status, minRisk]);

  const sortedFiltered = useMemo(
    () => [...filtered].sort((a, b) => b.riskScore - a.riskScore),
    [filtered]
  );

  // numericId → risk info (for map colouring)
  const countryRiskMap = useMemo(() => {
    const map = {};
    const upsert = (numId, reg) => {
      if (!numId) return;
      const ex = map[numId];
      if (!ex || reg.riskScore > ex.riskScore)
        map[numId] = { riskScore: reg.riskScore, shortName: reg.shortName, country: reg.country };
    };
    for (const reg of filtered) {
      if (reg.countryCode === "EU") EU_MEMBER_IDS.forEach(id => upsert(id, reg));
      else upsert(ALPHA2_TO_NUMERIC[reg.countryCode], reg);
    }
    return map;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Global Child Safety Compliance Intelligence
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                {totalCount} regulations across 4 regions · enforcement status, risk levels and key requirements
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-300 text-xs font-semibold tracking-wide">Built by Garima</p>
            <p className="text-slate-500 text-[10px] mt-0.5">Business Intelligence Portfolio</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7 space-y-7">

        {/* ── Metric Cards ───────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Total Regulations" value={totalCount}    icon="📋" valueClass="text-slate-700" />
          <MetricCard label="Enforced"           value={enforcedCount} icon="✅" valueClass="text-emerald-600" />
          <MetricCard label="High-Risk (≥ 7)"   value={highRiskCount} icon="⚠️" valueClass="text-orange-500" />
          <MetricCard label="Pending"            value={pendingCount}  icon="⏳" valueClass="text-amber-500" />
        </section>

        {/* ── Filter Bar ─────────────────────────────────────────────────── */}
        <section className="bg-slate-800 border border-slate-700 rounded-2xl px-6 py-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Filter
            <span className="ml-2 text-blue-400 normal-case font-normal">
              — {filtered.length} of {totalCount} regulations · map + cards update instantly
            </span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4 lg:gap-6 items-end">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Region</label>
              <select value={region} onChange={e => setRegion(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s === "All Statuses" ? s : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2 lg:flex-1 lg:min-w-64">
              <label className="text-xs text-slate-400 font-medium flex items-center gap-2">
                Minimum Risk Score
                <span className="font-bold text-sm" style={{ color: getRiskFill(minRisk) }}>{minRisk}</span>
                <span className="text-slate-500 font-normal">/ 10</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">1</span>
                <input type="range" min={1} max={10} value={minRisk}
                  onChange={e => setMinRisk(Number(e.target.value))}
                  className="flex-1 accent-blue-500 cursor-pointer" style={{ height: "6px" }} />
                <span className="text-xs text-slate-500">10</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 px-2">
                <span>Low</span><span>Medium</span><span>High</span><span>Critical</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── World Map ──────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-slate-300 font-semibold text-xs uppercase tracking-widest mb-3">
            Risk Coverage Map
            <span className="ml-2 text-slate-500 normal-case font-normal text-xs">hover a highlighted country for details</span>
          </h2>
          {mapError ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center h-48 text-slate-500 text-sm">
              ⚠ Unable to load world atlas. Check network access.
            </div>
          ) : !worldData ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center h-48">
              <div className="flex items-center gap-3 text-slate-500 text-sm">
                <svg className="animate-spin h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading world atlas…
              </div>
            </div>
          ) : (
            <WorldMap countryRiskMap={countryRiskMap} worldData={worldData} />
          )}
        </section>

        {/* ── Regional Momentum ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="text-slate-300 font-semibold text-xs uppercase tracking-widest">
              Regional Momentum
            </h2>
            <span className="text-slate-500 text-xs">
              ↑ rising = pending &gt; 2 &nbsp;·&nbsp; → active = 1–2 pending &nbsp;·&nbsp; ↓ stable = all enforced
            </span>
          </div>
          <RegionalMomentumCards />
        </section>

        {/* ── Country Cards ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="text-slate-300 font-semibold text-xs uppercase tracking-widest">
              Regulations
            </h2>
            <span className="text-slate-500 text-xs">
              {sortedFiltered.length} shown · sorted by risk score ↓ · click to expand
            </span>
          </div>

          {sortedFiltered.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center py-16 text-slate-500 text-sm">
              No regulations match the current filters.
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {sortedFiltered.map(reg => (
                <CountryCard key={reg.id} reg={reg} />
              ))}
            </div>
          )}
        </section>

        {/* ── Enforcement Trends ─────────────────────────────────────────── */}
        <section>
          {/* Section header */}
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="text-slate-300 font-semibold text-xs uppercase tracking-widest">
              Enforcement Trends
            </h2>
            <span className="text-slate-500 text-xs">
              {ENFORCEMENT_ACTIONS.length} verified actions 2019–2025 ·{" "}
              $
              {(ENFORCEMENT_ACTIONS
                .filter(d => typeof d.penaltyUSD === "number")
                .reduce((s, d) => s + d.penaltyUSD, 0) / 1_000_000_000
              ).toFixed(2)}B total penalties
            </span>
          </div>

          {/* Two-column layout: chart left, timeline right (stacks on small) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

            {/* Bar chart */}
            <div>
              <EnforcementBarChart />
            </div>

            {/* Timeline */}
            <div>
              <p className="text-slate-300 font-semibold text-xs uppercase tracking-widest mb-3">
                10 Most Recent Actions
              </p>
              <EnforcementTimeline />
            </div>

          </div>

          {/* Summary stat pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
            {[
              { label: "USA (FTC/DOJ)", count: "9 actions", total: "$598.7M", color: ENFORCEMENT_COLORS["USA"] },
              { label: "Ireland DPC",   count: "2 actions", total: "$805M",   color: ENFORCEMENT_COLORS["Ireland (EU)"] },
              { label: "UK ICO",        count: "1 action",  total: "$15.9M",  color: ENFORCEMENT_COLORS["United Kingdom"] },
              { label: "France CNIL",   count: "1 action",  total: "$5.4M",   color: ENFORCEMENT_COLORS["France"] },
              { label: "Italy Garante", count: "1 action",  total: "$15.6M",  color: ENFORCEMENT_COLORS["Italy (EU)"] },
            ].map(({ label, count, total, color }) => (
              <div key={label}
                className="bg-slate-800 rounded-xl border border-slate-700 px-4 py-3 flex flex-col gap-1"
                style={{ borderLeft: `3px solid ${color}` }}>
                <p className="text-slate-400 text-xs font-semibold">{label}</p>
                <p className="text-white font-bold text-base leading-tight">{total}</p>
                <p className="text-slate-500 text-xs">{count}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── AI Intelligence Briefs ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🤖</span>
                <h2 className="text-white font-bold text-sm tracking-tight">
                  AI Intelligence Briefs
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-violet-900/60 text-violet-300 border border-violet-700/60">
                  Beta
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                Methodology · pipeline · region-level executive risk analysis generated from regulatory dataset
              </p>
            </div>
          </div>
          <AiIntelligenceBriefs />
        </section>

      </main>

      {/* ── About Section ──────────────────────────────────────────────────── */}
      <AboutSection />

      <footer className="bg-slate-800 border-t border-slate-700 px-4 sm:px-6 py-5 mt-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-slate-500 text-xs">
            Data verified May 2025 · {totalCount} regulations · React, D3.js, AI-assisted analysis
          </p>
          <p className="text-slate-600 text-[10px]">
            Built by Garima · Business Intelligence Portfolio · For educational and professional showcase purposes
          </p>
        </div>
      </footer>
    </div>
  );
}

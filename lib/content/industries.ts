export type IndustryContentItem = {
  description: string;
  title: string;
};

export type IndustryAutomation = {
  flow: readonly string[];
  outcome: string;
  title: string;
};

export type IndustryEngagementPhase = {
  description: string;
  output: string;
  title: string;
};

export type IndustryPage = {
  automations: readonly IndustryAutomation[];
  digitalExperiences: readonly IndustryContentItem[];
  engagement: readonly IndustryEngagementPhase[];
  headline: string;
  integrations: readonly IndustryContentItem[];
  introduction: string;
  metaDescription: string;
  metaTitle: string;
  operationalSystems: readonly IndustryContentItem[];
  problems: readonly IndustryContentItem[];
  slug: string;
  summary: string;
  systemFlow: readonly string[];
  title: string;
};

export const industries = [
  {
    slug: "property-development",
    title: "Property Development",
    metaTitle: "Property Development Websites & Sales Systems",
    metaDescription:
      "Trexiti designs property development websites, buyer portals, sales systems, broker workflows, document processes, and payment tracking around the sales lifecycle.",
    headline: "Connect the development, the buyer journey and the sales operation.",
    summary:
      "Trexiti designs digital experiences and operational systems for property developers that need a clearer path from market interest to reservation, documentation, payment and reporting.",
    introduction:
      "A development website is often only the visible edge of a larger commercial system. Inventory, buyer information, broker activity, documents, payment schedules and management reporting need to remain coordinated behind it. Trexiti defines that operating model first, then determines which experiences, systems and integrations should support it.",
    problems: [
      { title: "Fragmented buyer information", description: "Inquiries, qualification notes, documents and follow-ups can become separated across inboxes, messaging applications and spreadsheets." },
      { title: "Unclear residence availability", description: "Sales teams and brokers may work from different versions of unit availability, pricing, reservation status and release information." },
      { title: "Manual document movement", description: "Reservation forms, buyer documents, approvals and agreements often depend on repeated handoffs without one visible status." },
      { title: "Limited sales visibility", description: "Management can struggle to see demand, pipeline movement, broker contribution, upcoming payments and blocked transactions in one place." },
    ],
    digitalExperiences: [
      { title: "Development websites", description: "Editorial digital experiences that communicate the place, proposition, residences and investment context with appropriate restraint." },
      { title: "Residence listings", description: "Searchable residence information connected to approved availability, plans, specifications and inquiry paths." },
      { title: "Interactive floor plans", description: "Clear exploration of buildings, levels, residence types and supporting information without turning the experience into a novelty." },
      { title: "Buyer and investor portals", description: "Secure access to documents, milestones, payment information, requests and project communication." },
      { title: "Lead capture journeys", description: "Structured inquiries that collect useful context, route interest correctly and create a clean sales record." },
    ],
    operationalSystems: [
      { title: "Buyer CRM", description: "One record for contact details, interests, conversations, documents, reservations and next actions." },
      { title: "Lead qualification", description: "Consistent qualification criteria, ownership, priority and progression across direct and broker-generated demand." },
      { title: "Broker management", description: "Broker records, introductions, assigned buyers, communication and commercial status." },
      { title: "Sales pipeline", description: "A governed path from inquiry through qualification, viewing, reservation, contracting and completion." },
      { title: "Document workflow", description: "Requirements, submission status, review, approvals and signed-document organization." },
      { title: "Payment schedule tracking", description: "Expected milestones, recorded payments, outstanding items and management visibility, connected to the appropriate finance platform." },
    ],
    automations: [
      { title: "Inquiry qualification", flow: ["Inquiry", "Buyer record", "Interest matched", "Owner notified"], outcome: "Create a structured sales record while the inquiry context is still complete." },
      { title: "Residence reservation", flow: ["Residence selected", "Availability checked", "Reservation recorded", "Sales view updated"], outcome: "Reduce conflicting availability information and make ownership explicit." },
      { title: "Document progress", flow: ["Requirement issued", "Document received", "Review assigned", "Status updated"], outcome: "Keep buyers and the internal team aligned without repeated manual status chasing." },
      { title: "Payment milestone", flow: ["Milestone due", "Reminder prepared", "Payment recorded", "Management view updated"], outcome: "Connect commercial follow-up to the finance record without pretending to replace accounting controls." },
    ],
    integrations: [
      { title: "CRM platforms", description: "Synchronize qualified demand and communication where an established CRM remains appropriate." },
      { title: "Email and messaging", description: "Route approved notifications and retain communication context against the buyer record." },
      { title: "Document storage", description: "Organize controlled project and buyer documents in the business's chosen repository." },
      { title: "Accounting software", description: "Exchange invoice, payment and balance information at clearly defined boundaries." },
      { title: "Analytics", description: "Connect acquisition, content and inquiry behavior to meaningful commercial stages." },
      { title: "Maps and location data", description: "Support location context, nearby amenities and development discovery." },
    ],
    engagement: [
      { title: "Development and sales discovery", description: "Understand the project, release strategy, audiences, sales model, broker relationships and decision process.", output: "Commercial and audience model" },
      { title: "Journey and information architecture", description: "Map discovery, inquiry, qualification, reservation, documentation and payment interactions.", output: "Experience and workflow blueprint" },
      { title: "System and integration design", description: "Define records, permissions, availability rules, document states and platform boundaries.", output: "Solution architecture" },
      { title: "Phased implementation", description: "Build the highest-value public and operational layers, validate them with users, then extend deliberately.", output: "Production release and roadmap" },
    ],
    systemFlow: ["Audience", "Inquiry", "Buyer CRM", "Residence", "Documents", "Payments", "Reporting"],
  },
  {
    slug: "real-estate",
    title: "Real Estate",
    metaTitle: "Real Estate Digital Experiences & Systems",
    metaDescription:
      "Trexiti designs real estate websites, property discovery, agent workflows, lead routing, transaction coordination, client portals, and reporting systems.",
    headline: "Turn property interest into a coordinated client and transaction journey.",
    summary:
      "Trexiti connects property discovery, inquiry handling, agent activity and transaction operations for real estate businesses that have outgrown disconnected listings and follow-up tools.",
    introduction:
      "Real estate operations sit across marketing, relationship management, property information, appointments, documents and transaction milestones. The right solution may combine an existing listing source or CRM with a purpose-built experience and operating layer. The objective is coordination—not unnecessary replacement.",
    problems: [
      { title: "Lead routing without context", description: "Inquiries may reach an agent without the property, preferences, urgency or prior activity needed for a useful response." },
      { title: "Property data in several places", description: "Availability, descriptions, media and commercial details can drift when the website, agent records and listing tools are maintained separately." },
      { title: "Inconsistent follow-up", description: "Next actions depend on individual memory when ownership, status and communication are not visible to the wider team." },
      { title: "Opaque transaction progress", description: "Clients and managers may lack a clear picture of viewings, offers, documents, approvals and closing requirements." },
    ],
    digitalExperiences: [
      { title: "Property discovery", description: "Fast, structured search and browsing around location, intent, property attributes and current availability." },
      { title: "Agency and brokerage websites", description: "Credible corporate experiences that position expertise while giving listings and services a coherent structure." },
      { title: "Agent profiles", description: "Useful expertise, areas, properties and contact journeys rather than isolated biography pages." },
      { title: "Client portals", description: "Shortlists, appointments, documents, requests and transaction progress in one secure place." },
    ],
    operationalSystems: [
      { title: "Property CRM", description: "Relationships, preferences, inquiries, viewings, offers and communication held against a connected client record." },
      { title: "Lead assignment", description: "Routing based on market, property, team capacity or defined account ownership." },
      { title: "Viewing coordination", description: "Availability, appointments, confirmations, access information and post-viewing actions." },
      { title: "Transaction workflow", description: "Offers, parties, documents, dependencies, milestones and responsible owners." },
      { title: "Management reporting", description: "Demand, responsiveness, pipeline movement, inventory activity and team workload." },
    ],
    automations: [
      { title: "Property inquiry", flow: ["Property viewed", "Inquiry submitted", "Lead enriched", "Agent assigned"], outcome: "Preserve the property and preference context through assignment." },
      { title: "Viewing lifecycle", flow: ["Viewing requested", "Time agreed", "Parties notified", "Follow-up created"], outcome: "Make the next action part of the process rather than an optional memory task." },
      { title: "Offer coordination", flow: ["Offer recorded", "Stakeholders notified", "Decision tracked", "Status synchronized"], outcome: "Maintain one auditable commercial status without automating judgment." },
      { title: "Document request", flow: ["Requirement identified", "Client notified", "File received", "Reviewer assigned"], outcome: "Reduce repeated checking while preserving human review." },
    ],
    integrations: [
      { title: "Listing feeds", description: "Use an appropriate property data source as the system of record where one exists." },
      { title: "CRM", description: "Connect marketing behavior, inquiries and operational stages to the relationship platform." },
      { title: "Calendars", description: "Coordinate appointments without creating a second unmanaged schedule." },
      { title: "Maps", description: "Support geographic discovery, boundaries and location context." },
      { title: "Document platforms", description: "Keep transaction documents governed by the chosen storage and signing services." },
      { title: "Analytics", description: "Measure useful journeys from property discovery through qualified inquiry." },
    ],
    engagement: [
      { title: "Operating model review", description: "Study how properties, leads, agents, clients and transactions are currently managed.", output: "Current-state system map" },
      { title: "Experience definition", description: "Define audience journeys, property information, qualification and service pathways.", output: "Product and content architecture" },
      { title: "Data and workflow design", description: "Set property, contact, activity and transaction records with clear ownership.", output: "Data and workflow specification" },
      { title: "Build and integration", description: "Implement the priority experience and operational connections in testable releases.", output: "Launched system and iteration plan" },
    ],
    systemFlow: ["Property", "Audience", "Inquiry", "Agent", "Viewing", "Transaction", "Insight"],
  },
  {
    slug: "hospitality",
    title: "Hospitality",
    metaTitle: "Hospitality Websites, Guest Portals & Systems",
    metaDescription:
      "Trexiti designs hospitality websites, booking journeys, guest portals, inquiry systems, concierge workflows, vendor coordination, and operational dashboards.",
    headline: "Connect the guest experience to the operation delivering it.",
    summary:
      "Trexiti designs hospitality digital experiences and operating systems that connect discovery, booking, guest requests, internal coordination and management visibility.",
    introduction:
      "A refined guest experience depends on much more than the booking interface. Inquiries, reservations, preferences, requests, teams and vendors must move together behind the scenes. Trexiti can improve the customer-facing journey while integrating the established hospitality platforms the business still depends on.",
    problems: [
      { title: "The website and operation diverge", description: "The digital promise can become disconnected from current availability, services, policies and the team's capacity to deliver." },
      { title: "Guest requests cross channels", description: "Email, calls, messaging and front-desk notes make ownership and status difficult to see." },
      { title: "Handoffs rely on individuals", description: "Reservations, concierge, housekeeping, maintenance and vendors may coordinate through informal messages rather than shared workflows." },
      { title: "Management sees activity late", description: "Operational issues and recurring requests can remain buried until they become service problems." },
    ],
    digitalExperiences: [
      { title: "Hotel and resort websites", description: "High-trust, high-performance experiences for rooms, residences, dining, amenities, location and the character of the property." },
      { title: "Booking experiences", description: "Clear availability and reservation pathways connected to the appropriate booking platform." },
      { title: "Guest portals", description: "Secure access to booking details, requests, itineraries, documents, payments and communication." },
      { title: "Experience discovery", description: "Structured exploration and inquiry for dining, wellness, events and local experiences." },
    ],
    operationalSystems: [
      { title: "Inquiry management", description: "Capture, categorize, assign and follow up on direct guest and event inquiries." },
      { title: "Concierge workflow", description: "Requests, ownership, due times, dependencies and guest-visible status." },
      { title: "Guest request operations", description: "Coordinate service requests across relevant teams with a reliable activity history." },
      { title: "Vendor management", description: "Supplier records, requests, confirmations, service status and supporting documents." },
      { title: "Operations dashboards", description: "A focused view of unresolved requests, workload, service patterns and operational exceptions." },
    ],
    automations: [
      { title: "Booking confirmation", flow: ["Booking confirmed", "Guest record matched", "Confirmation sent", "Team context updated"], outcome: "Keep guest communication and internal context aligned with the booking record." },
      { title: "Guest request", flow: ["Request received", "Category identified", "Owner assigned", "Status tracked"], outcome: "Make accountability visible while allowing staff to intervene at every stage." },
      { title: "Experience reservation", flow: ["Interest submitted", "Availability checked", "Booking recorded", "Itinerary updated"], outcome: "Connect a guest-facing request to the operational commitment behind it." },
      { title: "Service exception", flow: ["Delay detected", "Responsible team alerted", "Guest update prepared", "Resolution logged"], outcome: "Handle failure states explicitly rather than hiding them inside an automation." },
    ],
    integrations: [
      { title: "Property management systems", description: "Use reservation and guest-stay data through supported interfaces and agreed boundaries." },
      { title: "Booking engines", description: "Keep availability and transaction handling in the established booking platform where appropriate." },
      { title: "Payments", description: "Connect approved payment, deposit and receipt workflows." },
      { title: "Email and messaging", description: "Send governed communication and retain the operational context of guest requests." },
      { title: "Calendars", description: "Coordinate experiences, appointments, events and internal availability." },
      { title: "Analytics", description: "Understand meaningful discovery, booking and request journeys without inventing guest metrics." },
    ],
    engagement: [
      { title: "Guest and operations discovery", description: "Observe the journey from consideration through booking, arrival, stay and post-stay activity.", output: "Guest and service blueprint" },
      { title: "Platform boundary review", description: "Identify what the PMS, booking engine and other established tools already do well.", output: "Integration and ownership map" },
      { title: "Experience and workflow design", description: "Design the public experience and the staff workflows needed to support it.", output: "Prototype and operating specification" },
      { title: "Phased release", description: "Implement, test with operational users and introduce additional journeys as evidence supports them.", output: "Production release and roadmap" },
    ],
    systemFlow: ["Guest", "Discovery", "Booking", "Stay", "Request", "Team", "Operations"],
  },
  {
    slug: "healthcare",
    title: "Healthcare",
    metaTitle: "Healthcare Digital Experiences & Workflow Systems",
    metaDescription:
      "Trexiti designs healthcare provider discovery, booking and patient access experiences plus appointment, practitioner, records, and billing workflows.",
    headline: "Make access clearer and operational workflows more coordinated.",
    summary:
      "Trexiti designs healthcare digital experiences and operational software around patient access, practitioner coordination, appointment workflows and defined system integrations.",
    introduction:
      "Healthcare technology must be designed around real roles, sensitive information and operational responsibility. Trexiti begins with the service journey and workflow boundaries, then works with the organization to define appropriate permissions, integrations and controls. Regulatory or clinical requirements remain subject to the organization's qualified advisers and governing obligations.",
    problems: [
      { title: "Unclear paths to the right service", description: "Patients may struggle to understand providers, specialties, locations, requirements and the correct booking route." },
      { title: "Appointment coordination is manual", description: "Requests, availability, confirmations, changes and internal preparation may span several disconnected channels." },
      { title: "Practitioner information is duplicated", description: "Profiles, schedules, services and location information can become inconsistent across the website and internal tools." },
      { title: "Administrative status is hard to see", description: "Teams may lack one view of outstanding forms, requests, documents, billing steps and follow-up responsibilities." },
    ],
    digitalExperiences: [
      { title: "Provider discovery", description: "Accessible search and navigation by service, specialty, location and relevant availability information." },
      { title: "Booking journeys", description: "Clear appointment request or booking flows with the context required for appropriate routing." },
      { title: "Patient portals", description: "Secure access to appointments, approved documents, requests, payments and administrative communication." },
      { title: "Service information architecture", description: "Content structured around patient questions and pathways rather than internal organizational labels." },
    ],
    operationalSystems: [
      { title: "Appointment workflows", description: "Request, triage, scheduling, confirmation, preparation and follow-up stages with explicit ownership." },
      { title: "Practitioner management", description: "Provider profiles, locations, services, administrative availability and permissions." },
      { title: "Records workflow", description: "Defined requests, receipt, review and routing of approved document types without assuming replacement of the clinical record system." },
      { title: "Billing coordination", description: "Administrative payment status, invoices and supported billing integration boundaries." },
      { title: "Operations visibility", description: "Queues, unresolved actions, appointment activity and administrative bottlenecks." },
    ],
    automations: [
      { title: "Appointment request", flow: ["Request submitted", "Service matched", "Team review", "Booking confirmed"], outcome: "Reduce manual routing while preserving professional review where it is required." },
      { title: "Appointment preparation", flow: ["Booking confirmed", "Requirements identified", "Information requested", "Status visible"], outcome: "Give patients and administrators a clearer view of outstanding preparation." },
      { title: "Practitioner schedule change", flow: ["Change recorded", "Affected bookings identified", "Team action created", "Communication tracked"], outcome: "Coordinate disruption without allowing automation to make unsupported clinical decisions." },
      { title: "Billing status", flow: ["Charge approved", "Invoice issued", "Payment received", "Administrative record updated"], outcome: "Connect finance activity to the administrative journey through an agreed system of record." },
    ],
    integrations: [
      { title: "Scheduling platforms", description: "Coordinate supported availability and appointment records without creating conflicting calendars." },
      { title: "Electronic record systems", description: "Integrate only through approved interfaces, permissions and organization-defined information boundaries." },
      { title: "Payments and billing", description: "Connect authorized transaction and invoice information to administrative workflows." },
      { title: "Authentication", description: "Use appropriate identity, access and account recovery controls for the intended information." },
      { title: "Email and messaging", description: "Deliver approved administrative notifications without placing sensitive detail in unsuitable channels." },
      { title: "Analytics", description: "Measure public content and service-access journeys within the organization's privacy framework." },
    ],
    engagement: [
      { title: "Service and stakeholder analysis", description: "Understand patient, practitioner and administrative journeys, responsibilities and constraints.", output: "Service and role map" },
      { title: "Risk and boundary definition", description: "Work with organizational stakeholders to identify data classifications, approvals and governing requirements.", output: "Requirements and control boundary" },
      { title: "Workflow and architecture", description: "Define states, permissions, integrations, failure handling and human decisions.", output: "Solution architecture and prototype" },
      { title: "Controlled implementation", description: "Build and test in phases with the users responsible for operating and governing the system.", output: "Validated release and support plan" },
    ],
    systemFlow: ["Patient", "Service", "Request", "Review", "Appointment", "Administration", "Visibility"],
  },
  {
    slug: "professional-services",
    title: "Professional Services",
    metaTitle: "Professional Services Websites & Business Systems",
    metaDescription:
      "Trexiti designs professional services websites, client portals, CRM, engagement workflows, document systems, billing coordination, and management reporting.",
    headline: "Build a client experience as considered as the expertise behind it.",
    summary:
      "Trexiti connects positioning, lead qualification, client onboarding, delivery operations, documents, billing and management visibility for professional services businesses.",
    introduction:
      "Expert businesses often grow through relationships while their operating processes remain informal. As volume and complexity increase, inquiries, proposals, client information, delivery activity and billing can fragment. Trexiti designs the experience and operating system around the firm's actual way of working.",
    problems: [
      { title: "Expertise is difficult to navigate", description: "A website may list services without helping a prospective client understand fit, context or the right next conversation." },
      { title: "Qualification varies by person", description: "Commercial context, urgency, authority and service fit can be recorded inconsistently or not at all." },
      { title: "Onboarding crosses many tools", description: "Proposals, agreements, documents, billing details and delivery handoffs may depend on repeated manual coordination." },
      { title: "Workload and commercial visibility lag", description: "Leaders may not see pipeline, capacity, active work, blocked inputs and outstanding billing in one operating view." },
    ],
    digitalExperiences: [
      { title: "Corporate websites", description: "Editorial, high-trust experiences that communicate expertise, sectors, engagements and points of difference clearly." },
      { title: "Service qualification journeys", description: "Structured routes that help prospective clients identify fit and provide useful context before contact." },
      { title: "Client portals", description: "A secure place for requests, documents, milestones, payments and engagement communication." },
      { title: "Knowledge and insight platforms", description: "Content systems that organize useful thinking around the questions decision-makers actually have." },
    ],
    operationalSystems: [
      { title: "Relationship CRM", description: "Organizations, contacts, referrals, opportunities, communication and next actions." },
      { title: "Proposal workflow", description: "Scope, internal review, versioning, commercial approval and decision status." },
      { title: "Client onboarding", description: "Agreements, information requirements, responsible roles, setup and delivery handoff." },
      { title: "Engagement operations", description: "Workstreams, requests, milestones, dependencies, documents and client-visible progress." },
      { title: "Commercial reporting", description: "Pipeline, expected value, active engagements, outstanding inputs and billing status." },
    ],
    automations: [
      { title: "Qualified inquiry", flow: ["Inquiry submitted", "Fit assessed", "Owner assigned", "Discovery prepared"], outcome: "Improve the first conversation without replacing professional judgment." },
      { title: "Proposal approval", flow: ["Scope drafted", "Review requested", "Commercial approval", "Proposal issued"], outcome: "Make internal decisions and versions visible before a document reaches the client." },
      { title: "Client onboarding", flow: ["Agreement accepted", "Requirements issued", "Workspace prepared", "Team notified"], outcome: "Turn a won opportunity into a controlled delivery start." },
      { title: "Billing milestone", flow: ["Milestone reached", "Approval requested", "Invoice generated", "Status tracked"], outcome: "Connect delivery evidence to finance operations at an explicit approval point." },
    ],
    integrations: [
      { title: "CRM", description: "Connect qualified demand and account activity to the chosen relationship platform." },
      { title: "Document and signing tools", description: "Route approved proposals and agreements through established document controls." },
      { title: "Project management", description: "Exchange the right client, engagement and milestone context without duplicating every task." },
      { title: "Accounting", description: "Coordinate approved invoice, payment and outstanding-balance information." },
      { title: "Calendars and meetings", description: "Support discovery, reviews and recurring client commitments." },
      { title: "Email", description: "Record relevant commercial and operational communication against the correct account." },
    ],
    engagement: [
      { title: "Firm and client analysis", description: "Understand positioning, buyers, service lines, relationship ownership and delivery models.", output: "Commercial operating model" },
      { title: "Journey and process mapping", description: "Map the path from attention through qualification, proposal, onboarding and delivery.", output: "Client and employee journey map" },
      { title: "Experience and system design", description: "Define content, records, permissions, workflows and integration boundaries together.", output: "Prototype and solution architecture" },
      { title: "Implementation and adoption", description: "Release the priority system, prepare operating guidance and iterate from real use.", output: "Production system and adoption plan" },
    ],
    systemFlow: ["Audience", "Inquiry", "Qualification", "Proposal", "Engagement", "Billing", "Relationship"],
  },
  {
    slug: "construction",
    title: "Construction",
    metaTitle: "Construction Websites & Operational Systems",
    metaDescription:
      "Trexiti designs construction websites and project systems for project tracking, procurement, inventory, contractor coordination, job costing, and documents.",
    headline: "Connect commercial, project and field information around the work.",
    summary:
      "Trexiti designs construction digital experiences and operating systems that improve project visibility, procurement coordination, field accountability and document movement.",
    introduction:
      "Construction operations involve changing sites, multiple organizations and constant movement between office and field. A useful system must reflect those roles and handoffs rather than impose a generic dashboard. Trexiti maps how information enters, who acts on it and what evidence the next decision requires.",
    problems: [
      { title: "Project status lives in conversations", description: "Progress, blockers, commitments and changes may be known by individuals but unavailable as a shared operating picture." },
      { title: "Procurement lacks one timeline", description: "Requests, approvals, orders, deliveries and site needs can drift across spreadsheets, messages and supplier communication." },
      { title: "Documents move without context", description: "Drawings, submissions, photos, approvals and variations may be stored without a reliable link to the task or decision they support." },
      { title: "Cost and activity are separated", description: "Field progress, material movement, subcontractor work and commercial records can be difficult to reconcile during the project." },
    ],
    digitalExperiences: [
      { title: "Corporate websites", description: "A credible expression of capability, sectors, services, delivery approach and organizational standards." },
      { title: "Project portfolios", description: "Structured project stories organized around scope, context, discipline and evidence—not unsupported performance claims." },
      { title: "Client project portals", description: "Approved milestones, documents, progress information, requests and communication in one controlled space." },
      { title: "Contractor access", description: "Focused interfaces for assigned work, requirements, submissions and status." },
    ],
    operationalSystems: [
      { title: "Project tracking", description: "Milestones, work packages, dependencies, responsible parties, blockers and progress evidence." },
      { title: "Procurement", description: "Requests, approvals, purchasing, suppliers, expected delivery and site receipt." },
      { title: "Inventory", description: "Materials, tools, locations, movement, allocation, usage and alerts." },
      { title: "Contractor coordination", description: "Companies, contacts, assigned scope, documentation, activity and outstanding actions." },
      { title: "Job costing", description: "Approved budget structures, commitments, variations and actual cost information connected through finance integrations." },
      { title: "Document workflows", description: "Submission, review, approval, revision and distribution status tied to the relevant project context." },
    ],
    automations: [
      { title: "Material request", flow: ["Site request", "Approval routed", "Order prepared", "Delivery tracked"], outcome: "Connect field demand to procurement without removing commercial approval." },
      { title: "Progress evidence", flow: ["Work updated", "Evidence attached", "Reviewer notified", "Milestone status revised"], outcome: "Make progress updates more useful to the next decision." },
      { title: "Document review", flow: ["Submission received", "Reviewer assigned", "Decision recorded", "Parties notified"], outcome: "Maintain a visible decision history and current revision status." },
      { title: "Inventory exception", flow: ["Threshold reached", "Need validated", "Purchasing action created", "Resolution logged"], outcome: "Surface shortages early while retaining human approval and substitution decisions." },
    ],
    integrations: [
      { title: "Accounting and job costing", description: "Exchange approved commercial records with the financial system of record." },
      { title: "Document storage", description: "Connect project context to the organization's governed file repository." },
      { title: "Scheduling tools", description: "Coordinate milestones and commitments without maintaining conflicting programmes." },
      { title: "Maps and location", description: "Support sites, deliveries, assets and location-dependent activity." },
      { title: "Email and messaging", description: "Route notifications while keeping the actionable record inside the operating workflow." },
      { title: "External APIs", description: "Connect specialist estimating, procurement or project platforms where supported and justified." },
    ],
    engagement: [
      { title: "Office and field discovery", description: "Observe how project, commercial and site teams create, receive and act on information.", output: "Current-state operations map" },
      { title: "Process and role design", description: "Define states, approvals, ownership, evidence and escalation paths.", output: "Future-state workflow model" },
      { title: "Data and integration architecture", description: "Set the boundaries between project records, documents, finance and specialist tools.", output: "Technical solution architecture" },
      { title: "Phased project rollout", description: "Start with a high-value workflow, test in live operations and extend with controlled adoption.", output: "Operational release and rollout plan" },
    ],
    systemFlow: ["Client", "Project", "Office", "Field", "Procurement", "Commercial", "Reporting"],
  },
  {
    slug: "logistics",
    title: "Logistics",
    metaTitle: "Logistics Customer Experiences & Operations Systems",
    metaDescription:
      "Trexiti designs logistics customer portals, request and tracking experiences, job workflows, dispatch coordination, document systems, billing, and reporting.",
    headline: "Move information with the same discipline as the work itself.",
    summary:
      "Trexiti designs logistics digital experiences and operational systems that connect customer requests, planning, assignment, execution, documents, billing and reporting.",
    introduction:
      "Logistics businesses coordinate customers, jobs, locations, people, assets, documents and exceptions under time pressure. The technology should clarify ownership and status across that chain. Trexiti can build the central workflow and connect telematics, accounting, maps or other specialist platforms where they already provide the right capability.",
    problems: [
      { title: "Requests arrive without structure", description: "Email, calls and messages may omit locations, timing, load, service or commercial information needed for planning." },
      { title: "Status requires manual chasing", description: "Customers and internal teams ask for updates because progress and exceptions are not consistently recorded against the job." },
      { title: "Documents lag behind activity", description: "Proof, forms, receipts and supporting records may reach the office separately from the work they verify." },
      { title: "Operational and finance records diverge", description: "Completed work, charges, invoices and payment status can require duplicate entry and reconciliation." },
    ],
    digitalExperiences: [
      { title: "Corporate and service websites", description: "Clear service, coverage, capability and inquiry journeys for customers with different logistics needs." },
      { title: "Customer request portals", description: "Structured service requests with locations, requirements, attachments and contact context." },
      { title: "Tracking experiences", description: "Appropriate job status, milestones, documents and communication without exposing internal operational noise." },
      { title: "Account portals", description: "Requests, jobs, documents, invoices and service history for recurring customers." },
    ],
    operationalSystems: [
      { title: "Request and job management", description: "One operational record from customer request through planning, execution, completion and finance handoff." },
      { title: "Planning and dispatch", description: "Assignments, timing, locations, resources, dependencies and operational status." },
      { title: "Customer operations", description: "Accounts, contacts, service requirements, communication, history and outstanding actions." },
      { title: "Document workflow", description: "Required forms, proof, attachments, review and completion status." },
      { title: "Billing coordination", description: "Approved charges, invoice readiness, payment status and exceptions connected to accounting." },
      { title: "Operations reporting", description: "Work volume, status, delays, resource activity, unresolved issues and commercial progression." },
    ],
    automations: [
      { title: "Service request", flow: ["Request submitted", "Requirements validated", "Job created", "Planner notified"], outcome: "Give planning a complete record without pretending every request can be accepted automatically." },
      { title: "Dispatch update", flow: ["Assignment confirmed", "Schedule updated", "Operator notified", "Customer status prepared"], outcome: "Keep relevant parties aligned from one operational event." },
      { title: "Completion evidence", flow: ["Work completed", "Proof submitted", "Review passed", "Billing action created"], outcome: "Connect operational completion to commercial readiness with an explicit review step." },
      { title: "Exception handling", flow: ["Exception recorded", "Owner assigned", "Customer action decided", "Resolution tracked"], outcome: "Design failure states as part of the workflow rather than relying on unstructured escalation." },
    ],
    integrations: [
      { title: "Maps and routing", description: "Use location and route services for planning context where supported." },
      { title: "Telematics", description: "Connect approved asset or movement data without rebuilding specialist tracking capability." },
      { title: "Accounting", description: "Exchange customer, invoice and payment information at controlled workflow stages." },
      { title: "Email and messaging", description: "Send status communication and retain its relationship to the job." },
      { title: "Cloud storage", description: "Organize proof and operational documents in the chosen repository." },
      { title: "Customer APIs and webhooks", description: "Receive or return agreed job events for customers that operate connected systems." },
    ],
    engagement: [
      { title: "Operational observation", description: "Follow representative requests through planning, execution, exception handling and billing.", output: "End-to-end workflow map" },
      { title: "System-of-record decisions", description: "Identify which platform owns customers, jobs, locations, assets, documents and finance status.", output: "Data ownership model" },
      { title: "Workflow and interface design", description: "Design role-based desktop, field and customer experiences around the same operational states.", output: "Prototype and solution architecture" },
      { title: "Incremental implementation", description: "Launch a bounded workflow, monitor reliability and extend only after operational validation.", output: "Production workflow and expansion plan" },
    ],
    systemFlow: ["Customer", "Request", "Planning", "Dispatch", "Execution", "Billing", "Insight"],
  },
] as const satisfies readonly IndustryPage[];

export type IndustrySlug = (typeof industries)[number]["slug"];

export function getIndustry(slug: string) {
  return industries.find((industry) => industry.slug === slug);
}

export const industryLinks = industries.map((industry) => ({
  href: `/industries/${industry.slug}`,
  label: industry.title,
}));

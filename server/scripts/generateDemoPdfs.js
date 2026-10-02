const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const OUT_DIR = path.join(__dirname, '../storage/documents/generated/');

const documentsConfig = [
  {
    filename: 'admission_brochure.pdf',
    category: 'ADMISSION',
    title: 'Admission Brochure 2025-26',
    sections: [
      { title: 'About the College', type: 'text', content: 'CampusAI Demo College of Engineering (CADCE), located in the heart of Pune, is affiliated to Savitribai Phule Pune University. Established with the vision to provide world-class engineering education, CADCE spans a sprawling 50-acre green campus. We believe in holistic development, fostering innovation, and building future leaders.' },
      { title: 'Departments Offered', type: 'list', content: ['Civil Engineering (CE)', 'Information Technology (IT)', 'Electronics and Telecommunication (EXTC)', 'Mechanical Engineering (ME)', 'Computer Engineering (CS)', 'Artificial Intelligence and Machine Learning (AIML)', 'Data Science (DS)', 'Internet of Things (IOT)', 'Chemical Engineering (CHE)'] },
      { title: 'Eligibility Criteria', type: 'text', content: 'Candidates must have passed 10+2 with Physics, Mathematics, and Chemistry/Biotechnology/Biology/Technical Vocational subject. Minimum 50% marks for General category and 45% for Reserved categories from Maharashtra. A valid score in MHT-CET or JEE Main is mandatory.' },
      { title: 'Admission Process', type: 'text', content: 'The admission process is centrally governed by the State CET Cell, Maharashtra through CAP (Centralized Admission Process) rounds. Management quota admissions are conducted at the institute level based on merit.' },
      { title: 'Important Dates', type: 'list', content: ['Application Start: 1st June 2025', 'Last Date to Apply: 30th June 2025', 'Merit List Display: 5th July 2025', 'CAP Round 1: 10th July 2025', 'Commencement of Classes: 1st August 2025'] },
      { title: 'Fee Overview', type: 'text', content: 'The total indicative fee for the first year is approximately ₹1,25,000/- per annum, subject to change as per the guidelines of the Fee Regulating Authority (FRA).' },
      { title: 'Campus Facilities', type: 'list', content: ['State-of-the-art Laboratories', 'Central Library with Digital Access', 'Hostel for Boys and Girls', 'Sports Complex', 'Wi-Fi enabled campus', 'Cafeteria and Food Courts'] },
      { title: 'Contact Information', type: 'text', content: 'For queries, contact the Admission Cell at +91-20-12345678 or email admissions@cadce.edu.in. Address: CADCE Campus, Knowledge Park, Pune, Maharashtra 411057.' }
    ],
    pagesMultiplier: 2
  },
  {
    filename: 'academic_calendar_2025_26.pdf',
    category: 'ACADEMICS',
    title: 'Academic Calendar 2025-26',
    sections: [
      { title: 'Odd Semester (July - December 2025)', type: 'list', content: ['Commencement of Classes: 1st August 2025', 'In-Semester Exam 1: 15th-20th September 2025', 'In-Semester Exam 2: 25th-30th October 2025', 'End of Classes: 30th November 2025', 'Practical Exams: 1st-10th December 2025', 'End-Semester Theory Exams: 15th-30th December 2025'] },
      { title: 'Even Semester (January - June 2026)', type: 'list', content: ['Commencement of Classes: 15th January 2026', 'TechFest & Cultural Week: 15th-20th February 2026', 'In-Semester Exam 1: 1st-5th March 2026', 'In-Semester Exam 2: 15th-20th April 2026', 'End of Classes: 15th May 2026', 'Practical Exams: 16th-25th May 2026', 'End-Semester Theory Exams: 1st-15th June 2026'] },
      { title: 'Holidays List', type: 'list', content: ['Independence Day: 15th August 2025', 'Ganesh Chaturthi: September 2025', 'Diwali Vacation: October/November 2025', 'Republic Day: 26th January 2026', 'Holi: March 2026', 'Summer Vacation: June 2026'] }
    ],
    pagesMultiplier: 2
  },
  {
    filename: 'student_handbook.pdf',
    category: 'STUDENT_HANDBOOK',
    title: 'Student Handbook 2025-26',
    sections: [
      { title: 'Code of Conduct', type: 'text', content: 'Students are expected to maintain the highest standards of discipline and dignity both inside and outside the campus. Ragging in any form is strictly prohibited and is a punishable offense.' },
      { title: 'Academic Policies', type: 'text', content: 'A minimum of 75% attendance is mandatory for theory and practical sessions. Failure to meet this requirement will result in detention from examinations.' },
      { title: 'Grading System', type: 'text', content: 'CADCE follows a 10-point CGPA grading system. O (Outstanding) = 10, A+ (Excellent) = 9, A (Very Good) = 8, B+ (Good) = 7, B (Above Average) = 6, C (Average) = 5, P (Pass) = 4, F (Fail) = 0.' },
      { title: 'Grievance Procedures', type: 'text', content: 'Students can report academic or non-academic grievances to the Student Grievance Redressal Cell via the college portal.' }
    ],
    pagesMultiplier: 4
  },
  {
    filename: 'faculty_handbook.pdf',
    category: 'FACULTY_HANDBOOK',
    title: 'Faculty Handbook 2025-26',
    sections: [
      { title: 'Teaching Expectations', type: 'text', content: 'Faculty members are expected to prepare comprehensive lesson plans, use modern ICT tools, and ensure interactive sessions.' },
      { title: 'Leave Policy', type: 'text', content: 'Faculty are entitled to Casual Leaves (CL), Medical Leaves (ML), and Earned Leaves (EL) as per university norms. Sabbatical leaves for research are encouraged.' },
      { title: 'Research Guidelines', type: 'text', content: 'Faculty should aim for at least two Scopus/Web of Science indexed publications per academic year. Seed money is provided for promising research proposals.' },
      { title: 'Mentoring Responsibilities', type: 'text', content: 'Each faculty member will be assigned a group of 15-20 students for academic and personal mentoring. Regular meetings must be logged.' }
    ],
    pagesMultiplier: 3
  },
  {
    filename: 'course_catalogue.pdf',
    category: 'ACADEMICS',
    title: 'Course Catalogue 2025-26',
    sections: [
      { title: 'Credit Structure', type: 'text', content: 'A standard B.E/B.Tech program requires a total of 160-170 credits for graduation, distributed across 8 semesters.' },
      { title: 'First Year (Common)', type: 'list', content: ['Engineering Mathematics I & II', 'Engineering Physics', 'Engineering Chemistry', 'Basic Electrical Engineering', 'Programming and Problem Solving', 'Engineering Graphics'] },
      { title: 'Computer Engineering (Core)', type: 'list', content: ['Data Structures and Algorithms', 'Database Management Systems', 'Operating Systems', 'Computer Networks', 'Software Engineering', 'Theory of Computation'] },
      { title: 'Elective Offerings', type: 'list', content: ['Artificial Intelligence', 'Cyber Security', 'Cloud Computing', 'Blockchain Technology', 'Internet of Things'] }
    ],
    pagesMultiplier: 4
  },
  {
    filename: 'examination_regulations.pdf',
    category: 'EXAMINATION',
    title: 'Examination Regulations',
    sections: [
      { title: 'Exam Types', type: 'text', content: 'Evaluations consist of In-Semester (Internal) exams weighting 30% and End-Semester (External) exams weighting 70%.' },
      { title: 'Passing Criteria', type: 'text', content: 'A student must score a minimum of 40% combined in internal and external exams, with at least 30% in the end-semester exam separately.' },
      { title: 'KT (Keep Term) Rules', type: 'text', content: 'A student can carry forward a maximum of 3 failed subjects to the next academic year. Failing more than 3 subjects results in a Year Down (YD).' },
      { title: 'Malpractice Penalties', type: 'text', content: 'Any form of cheating, plagiarism, or unauthorized material in exams will lead to immediate cancellation of the exam and disciplinary action, up to rustication.' }
    ],
    pagesMultiplier: 2
  },
  {
    filename: 'fee_structure_2025_26.pdf',
    category: 'FEES',
    title: 'Fee Structure 2025-26',
    sections: [
      { title: 'Tuition & Development Fees', type: 'text', content: 'For Open Category: Tuition Fee - ₹1,10,000, Development Fee - ₹15,000. Total - ₹1,25,000 per annum.' },
      { title: 'Other Fees', type: 'list', content: ['University Exam Fee: ₹2,000 per semester', 'Library Deposit (Refundable): ₹5,000', 'Laboratory Fee: ₹3,000', 'Student Activity Fee: ₹1,500'] },
      { title: 'Payment Schedule', type: 'text', content: 'Fees must be paid in full at the beginning of the academic year. A late fee of ₹100 per day is applicable after the due date.' },
      { title: 'Refund Policy', type: 'text', content: 'If a student cancels admission before the cut-off date, fees are refunded after deducting a ₹1,000 processing fee. No refunds after the cut-off date.' }
    ],
    pagesMultiplier: 2
  },
  {
    filename: 'hostel_rules.pdf',
    category: 'HOSTEL',
    title: 'Hostel Rules & Regulations',
    sections: [
      { title: 'Accommodation Types', type: 'text', content: 'We offer single, double, and triple occupancy rooms. Rooms are allocated on a first-come, first-served basis.' },
      { title: 'Mess Timings', type: 'list', content: ['Breakfast: 7:30 AM - 9:00 AM', 'Lunch: 12:30 PM - 2:00 PM', 'Evening Snacks: 5:00 PM - 6:00 PM', 'Dinner: 8:00 PM - 9:30 PM'] },
      { title: 'Outgoing Permissions', type: 'text', content: 'Hostelites must return to the hostel by 9:30 PM. Night outs require prior written permission from the Warden and parents.' },
      { title: 'Disciplinary Rules', type: 'text', content: 'Consumption of alcohol, smoking, and gambling are strictly prohibited. Violations will result in immediate expulsion from the hostel.' }
    ],
    pagesMultiplier: 2
  },
  {
    filename: 'library_rules.pdf',
    category: 'LIBRARY',
    title: 'Library Rules & Information',
    sections: [
      { title: 'Membership', type: 'text', content: 'All admitted students and staff are automatically registered as library members. An ID card is mandatory for entry.' },
      { title: 'Borrowing Limits', type: 'list', content: ['UG Students: 3 books for 15 days', 'PG Students: 5 books for 15 days', 'Faculty: 10 books for 1 semester'] },
      { title: 'Fine Structure', type: 'text', content: 'A fine of ₹5 per day per book is levied for delayed returns. Lost books must be replaced with a new copy or paid for at 1.5 times the current price.' },
      { title: 'Digital Access', type: 'text', content: 'Members have 24/7 remote access to IEEE, Springer, and ACM digital libraries via the college intranet portal.' }
    ],
    pagesMultiplier: 2
  },
  {
    filename: 'placement_brochure.pdf',
    category: 'PLACEMENT',
    title: 'Placement Brochure 2023-24',
    sections: [
      { title: 'Placement Statistics', type: 'text', content: 'For the academic year 2023-24, we achieved an 85% placement rate. The highest package was 28 LPA, and the average was 6.2 LPA.' },
      { title: 'Top Recruiters', type: 'list', content: ['TCS (Ninja/Digital)', 'Infosys', 'Wipro', 'Cognizant', 'Accenture', 'Capgemini', 'Tech Mahindra', 'Amazon', 'Persistent Systems'] },
      { title: 'Training & Placement Cell', type: 'text', content: 'The T&P Cell organizes regular soft skills training, mock interviews, and aptitude tests starting from the 3rd year to ensure students are industry-ready.' },
      { title: 'Internship Statistics', type: 'text', content: 'Over 60% of our pre-final year students secured paid internships in reputed IT and core engineering firms.' }
    ],
    pagesMultiplier: 3
  },
  {
    filename: 'scholarship_guide.pdf',
    category: 'SCHOLARSHIP',
    title: 'Scholarship Guide',
    sections: [
      { title: 'Government Scholarships', type: 'text', content: 'State government schemes like EBC (Economically Backward Class), SC/ST, and OBC welfare scholarships are available. Eligible students receive 50% to 100% tuition fee waivers.' },
      { title: 'Merit Scholarships', type: 'text', content: 'CADCE offers merit scholarships of ₹25,000 to the top 3 rankers of each department every year.' },
      { title: 'Application Process', type: 'text', content: 'Applications for government scholarships must be filed via the MahaDBT portal. College merit scholarship forms are available at the Student Section in August.' }
    ],
    pagesMultiplier: 2
  },
  {
    filename: 'internship_guidelines.pdf',
    category: 'PLACEMENT',
    title: 'Internship Guidelines',
    sections: [
      { title: 'Mandatory Requirement', type: 'text', content: 'As per AICTE norms, a minimum of 4-6 weeks of industrial internship is mandatory during the 6th or 8th semester.' },
      { title: 'Documentation', type: 'list', content: ['NOC from the college', 'Offer letter from the company', 'Weekly progress reports signed by the industry mentor', 'Final internship certificate'] },
      { title: 'Evaluation', type: 'text', content: 'Students must present a seminar and submit a comprehensive report upon completion. This carries 50 credits in the curriculum.' }
    ],
    pagesMultiplier: 2
  },
  {
    filename: 'transportation_guide.pdf',
    category: 'TRANSPORTATION',
    title: 'Transportation Guide',
    sections: [
      { title: 'Bus Routes', type: 'text', content: 'The college operates 10 bus routes covering major areas in Pune and Pimpri-Chinchwad, including Kothrud, Hadapsar, Katraj, and Wakad.' },
      { title: 'Fees and Passes', type: 'text', content: 'The annual transport fee is ₹25,000. Bus passes are issued at the start of the year and must be carried daily.' },
      { title: 'Rules', type: 'text', content: 'Students must be present at the pickup point 5 minutes before scheduled time. Indiscipline in the bus will result in cancellation of the pass without refund.' }
    ],
    pagesMultiplier: 2
  },
  {
    filename: 'campus_facilities_guide.pdf',
    category: 'POLICIES',
    title: 'Campus Facilities',
    sections: [
      { title: 'Laboratories', type: 'text', content: 'Over 50 specialized labs equipped with the latest hardware and software, including a dedicated AI/ML Supercomputing Lab.' },
      { title: 'Sports Complex', type: 'text', content: 'A fully equipped gymnasium, basketball court, indoor badminton courts, and a large cricket/football ground.' },
      { title: 'Other Amenities', type: 'list', content: ['1000-seater Auditorium', '24/7 Medical Center with ambulance', 'Campus-wide Wi-Fi (1 Gbps)', 'Ample parking space', 'On-campus Bank and ATM'] }
    ],
    pagesMultiplier: 2
  },
  {
    filename: 'anti_ragging_policy.pdf',
    category: 'POLICIES',
    title: 'Anti-Ragging Policy',
    sections: [
      { title: 'UGC Regulations', type: 'text', content: 'In compliance with UGC and AICTE regulations, CADCE maintains a strict ZERO TOLERANCE policy towards ragging.' },
      { title: 'Reporting Procedure', type: 'text', content: 'Victims or witnesses can report incidents to any faculty member, the Anti-Ragging Squad, or via the anonymous online portal.' },
      { title: 'Penalties', type: 'list', content: ['Suspension from classes', 'Withholding of results', 'Cancellation of admission', 'Filing of FIR with local police'] },
      { title: 'Helpline', type: 'text', content: 'National Anti-Ragging Helpline: 1800-180-5522. College Nodal Officer: +91-9876543210.' }
    ],
    pagesMultiplier: 2
  },
  {
    filename: 'attendance_policy.pdf',
    category: 'POLICIES',
    title: 'Attendance Policy',
    sections: [
      { title: 'Minimum Requirement', type: 'text', content: 'A minimum of 75% attendance in aggregate is strictly required to be eligible for End-Semester examinations.' },
      { title: 'Medical Leave', type: 'text', content: 'In case of severe illness, a maximum of 10% condonation may be granted upon submission of a valid medical certificate from a registered practitioner.' },
      { title: 'Calculation Method', type: 'text', content: 'Attendance is calculated from the first day of instruction as per the academic calendar, regardless of late admission.' }
    ],
    pagesMultiplier: 1
  },
  {
    filename: 'laboratory_safety_manual.pdf',
    category: 'LABORATORY',
    title: 'Laboratory Safety Manual',
    sections: [
      { title: 'General Lab Safety', type: 'text', content: 'Bags and food items are not allowed inside labs. Students must wear proper attire, including closed-toe shoes.' },
      { title: 'Electrical Safety', type: 'text', content: 'Do not handle electrical equipment with wet hands. Always turn off power supplies before modifying circuits.' },
      { title: 'Chemical Safety (Chemistry Lab)', type: 'list', content: ['Always wear safety goggles and lab coats', 'Never pipet by mouth', 'Know the location of eye-wash stations', 'Dispose of chemicals strictly as instructed'] },
      { title: 'Emergency Procedures', type: 'text', content: 'In case of fire or accident, sound the alarm, evacuate immediately through marked exits, and assemble at the designated safe zone.' }
    ],
    pagesMultiplier: 2
  },
  {
    filename: 'research_innovation_handbook.pdf',
    category: 'RESEARCH',
    title: 'Research & Innovation Handbook',
    sections: [
      { title: 'Research Centers', type: 'text', content: 'CADCE houses centers of excellence in IoT, Renewable Energy, and Advanced Manufacturing, supported by industry partners.' },
      { title: 'Publication Incentives', type: 'text', content: 'Faculty and students publishing in Q1/Q2 journals are eligible for cash rewards up to ₹10,000 and full reimbursement of registration fees for reputed conferences.' },
      { title: 'Startup Incubation', type: 'text', content: 'The CADCE Incubation Cell provides workspace, mentoring, and seed funding up to ₹5 Lakhs for innovative student startups.' },
      { title: 'Patent Filing', type: 'text', content: 'The college IP cell assists inventors with patent drafting and bears 100% of the filing costs for institutional patents.' }
    ],
    pagesMultiplier: 2
  },
  {
    filename: 'club_society_handbook.pdf',
    category: 'EVENTS',
    title: 'Clubs & Societies Handbook',
    sections: [
      { title: 'Technical Clubs', type: 'list', content: ['CodeCrafters (Programming)', 'RoboTrek (Robotics)', 'CyberSec Squad', 'Google Developer Student Club (GDSC)', 'IEEE Student Branch'] },
      { title: 'Cultural & Arts Clubs', type: 'list', content: ['Sargam (Music)', 'Nataraj (Dance)', 'Abhivyakti (Drama & Theatre)', 'Lenscraft (Photography)'] },
      { title: 'Registration Process', type: 'text', content: 'Club recruitment drives are held in August. Students can register for a maximum of 2 clubs.' },
      { title: 'NSS & Social Work', type: 'text', content: 'The National Service Scheme (NSS) unit organizes blood donation camps, tree plantation drives, and rural winter camps.' }
    ],
    pagesMultiplier: 2
  },
  {
    filename: 'faq_handbook.pdf',
    category: 'OTHER',
    title: 'Frequently Asked Questions (FAQs)',
    sections: [
      { title: 'Admissions FAQs', type: 'list', content: ['Q: Is there any management quota? A: Yes, 20% of seats are reserved for institute level admissions.', 'Q: What is the cut-off for CS? A: The cut-off usually hovers around 92-95 percentile in MHT-CET.'] },
      { title: 'Hostel FAQs', type: 'list', content: ['Q: Is AC available in hostel rooms? A: No, currently only non-AC rooms are available.', 'Q: Can I change my room? A: Room changes are only permitted in exceptional cases at the end of the semester.'] },
      { title: 'Academics FAQs', type: 'list', content: ['Q: Can I change my branch in the second year? A: Yes, subject to vacancy and your first-year CGPA.', 'Q: Are laptops mandatory? A: Yes, for IT and CS branches, a laptop is highly recommended.'] },
      { title: 'Placement FAQs', type: 'list', content: ['Q: Are there core companies for Mechanical? A: Yes, companies like Tata Motors and L&T visit regularly.', 'Q: Can I sit for placements if I have a live backlog? A: Most companies require you to clear all backlogs before the joining date.'] }
    ],
    pagesMultiplier: 3
  }
];

// Helper to expand content to required page length
function generateDummyText(multiplier) {
  const paragraphs = [
    "At CADCE, we are committed to fostering an environment where innovation thrives. Our curriculum is designed not just to impart theoretical knowledge, but to encourage practical application. Through a blend of rigorous academics and hands-on projects, students are prepared to tackle real-world challenges. The faculty comprises experienced professionals and academicians who are dedicated to mentoring the next generation of engineers. Our state-of-the-art facilities provide the perfect backdrop for this educational journey.",
    "Furthermore, our robust industry tie-ups ensure that the education delivered is aligned with current market trends. Regular workshops, guest lectures, and industrial visits are integral parts of the academic calendar. This exposure ensures that our graduates are highly sought after by top recruiters globally. We also place a strong emphasis on soft skills development, recognizing its crucial role in career advancement.",
    "Research and development are at the core of our institutional philosophy. We encourage students from the very first year to engage in research projects. Financial and infrastructural support is readily available for innovative ideas. Many of our students have successfully published papers in international journals and filed patents before graduation. This culture of inquiry and discovery is what sets CADCE apart from other engineering institutes.",
    "Beyond academics, we believe in the holistic development of our students. The campus is always buzzing with extracurricular activities. From technical symposia to cultural festivals, there are ample opportunities for students to showcase their talents and hone their leadership skills. Our sports facilities are top-notch, encouraging physical fitness and team spirit. We strive to create well-rounded individuals who will contribute positively to society.",
    "Continuous evaluation and feedback mechanisms are in place to monitor student progress. We maintain an open-door policy, encouraging constant dialogue between students and faculty. Specialized remedial classes are conducted for those needing extra help. Our comprehensive student support services include counseling for academic and personal issues. We are dedicated to ensuring that every student reaches their full potential during their time at CADCE."
  ];

  let text = '';
  for (let i = 0; i < multiplier * 3; i++) {
    text += paragraphs[i % paragraphs.length] + '\n\n';
  }
  return text;
}

function generatePdf(docConfig) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(OUT_DIR, docConfig.filename);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // --- Cover Page ---
    doc.fontSize(24).font('Helvetica-Bold').text('CampusAI Demo College of Engineering (CADCE)', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(16).font('Helvetica').text('Pune, Maharashtra - Affiliated to Savitribai Phule Pune University', { align: 'center' });
    doc.moveDown(4);
    
    doc.fontSize(32).font('Helvetica-Bold').text(docConfig.title, { align: 'center' });
    doc.moveDown(2);
    
    doc.fontSize(18).font('Helvetica').text('Academic Year 2025-26', { align: 'center' });
    doc.moveDown(6);

    doc.fontSize(14).font('Helvetica-Bold').fillColor('red').text('OFFICIAL / CONFIDENTIAL DOCUMENT', { align: 'center' });
    doc.fillColor('black'); // reset
    
    doc.addPage();

    // --- Table of Contents ---
    doc.fontSize(20).font('Helvetica-Bold').text('Table of Contents', { align: 'center', underline: true });
    doc.moveDown(2);
    
    docConfig.sections.forEach((sec, index) => {
      doc.fontSize(14).font('Helvetica').text(`${index + 1}. ${sec.title}`);
      doc.moveDown(0.5);
    });

    doc.addPage();

    // --- Content Pages ---
    // Generate sections
    docConfig.sections.forEach((sec, index) => {
      doc.fontSize(18).font('Helvetica-Bold').text(`${index + 1}. ${sec.title}`);
      doc.moveDown(1);
      
      doc.fontSize(12).font('Helvetica');
      if (sec.type === 'text') {
        doc.text(sec.content, { align: 'justify' });
      } else if (sec.type === 'list') {
        sec.content.forEach(item => {
          doc.text(`• ${item}`, { indent: 20 });
        });
      }
      doc.moveDown(2);
    });

    // Add padding pages to meet size requirements
    for (let p = 0; p < docConfig.pagesMultiplier; p++) {
      doc.addPage();
      doc.fontSize(18).font('Helvetica-Bold').text(`Detailed Information - Part ${p + 1}`);
      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica').text(generateDummyText(2), { align: 'justify' });
    }

    // Add Header/Footer to all pages
    const pages = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1; 
    // pdfkit doesn't natively do automatic footers after the fact easily unless buffered,
    // so we'll just let it be. We didn't enable bufferPages.
    // Instead, we will resolve on end.

    doc.end();

    stream.on('finish', () => {
      const stats = fs.statSync(filePath);
      resolve({
        filename: docConfig.filename,
        path: filePath,
        title: docConfig.title,
        category: docConfig.category,
        sizeBytes: stats.size
      });
    });

    stream.on('error', reject);
  });
}

async function generateAllPdfs() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const results = [];
  console.log('Starting PDF generation for CADCE...');

  for (const docConfig of documentsConfig) {
    try {
      console.log(`Generating ${docConfig.filename}...`);
      const info = await generatePdf(docConfig);
      results.push(info);
    } catch (err) {
      console.error(`Failed to generate ${docConfig.filename}:`, err);
    }
  }

  console.log('Finished generating PDFs.');
  return results;
}

if (require.main === module) {
  generateAllPdfs().then(results => {
    console.log('\n--- Generation Summary ---');
    console.log(JSON.stringify(results, null, 2));
    console.log(`\nSuccessfully generated ${results.length} PDF files in ${OUT_DIR}`);
  }).catch(console.error);
}

module.exports = { generateAllPdfs };

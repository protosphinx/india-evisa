// Seed content, summarised from indianvisaonline.gov.in/evisa/tvoa.html on
// 2026-10-26. The seed script writes this into erp.ai; the server falls back
// to it only when erp.ai is not configured or unreachable.

const OFFICIAL = 'https://indianvisaonline.gov.in/evisa/';
// The site itself. Links here are rendered as same-site paths by the frontend.
const SITE = 'https://india-evisa.build.host';

const ordered = (rows) => rows.map((row, i) => ({ ...row, order: i + 1 }));

export const CONTENT = {
  services: ordered([
    { name: 'Start a new application', kind: 'Primary', icon: 'file-plus', link: `${SITE}/apply`, description: 'Fill in the form and upload your photo and passport page.' },
    { name: 'Continue a saved application', kind: 'Primary', icon: 'file-clock', link: `${SITE}/apply?resume`, description: 'Pick up a saved draft with its reference and your email.' },
    { name: 'Check visa status', kind: 'Task', icon: 'search', link: `${SITE}/apply?status`, description: 'See whether your ETA has been granted.' },
    { name: 'Pay or verify fee', kind: 'Task', icon: 'card', link: `${OFFICIAL}PaymentCheck`, description: 'Pay the e-Visa fee or confirm a payment went through.' },
    { name: 'Print your e-Visa', kind: 'Task', icon: 'printer', link: `${OFFICIAL}PrintApplication`, description: 'Download the ETA to carry when you travel.' },
    { name: 'Re-upload documents', kind: 'Task', icon: 'upload', link: `${OFFICIAL}ReuploadData`, description: 'Replace a photo or document you were asked to fix.' },
    { name: 'Move ETA to a new passport', kind: 'Task', icon: 'passport', link: `${OFFICIAL}PassportChange`, description: 'Transfer an ETA issued on your old passport.' },
    { name: 'See a sample application', kind: 'Task', icon: 'file', link: `${OFFICIAL}images/SampleForm.pdf`, description: 'A filled-in form to read before you start (PDF).' },
  ]),

  notices: ordered([
    { name: 'Move your e-Visa or ETA to a new passport', tag: 'New service', body: 'Renewed your passport after the ETA was granted? You can now transfer the ETA to the new passport online.', link: `${OFFICIAL}PassportChange`, linkLabel: 'Transfer ETA' },
    { name: 'Afghan nationals apply on a separate portal', tag: 'Afghanistan', body: 'Nationals of Afghanistan should use the dedicated visa portal instead of this form.', link: 'https://indianvisaonline.gov.in/avisa', linkLabel: 'Open Afghan portal' },
    { name: 'File your e-Arrival card before you land', tag: 'Before you fly', body: 'Foreigners and OCI cardholders can submit the e-Arrival card within 72 hours before arrival on boi.gov.in, indianvisaonline.gov.in or the Indian Visa Su-Swagatam app.', link: 'https://indianvisaonline.gov.in/earrival/', linkLabel: 'Fill e-Arrival card' },
  ]),

  visaTypes: ordered([
    {
      name: 'e-Tourist Visa', code: 'e-T1 V', purpose: 'Tourism',
      summary: 'Sightseeing, visiting family or friends, short courses and short voluntary work.',
      subPurposes: 'Recreation and sightseeing\nVisiting friends or relatives\nShort-term courses, such as yoga programmes\nVoluntary work of up to one month',
      validity: '30 days, 1 year or 5 years from grant',
      entries: 'Multiple',
      stay: 'Up to 180 days per calendar year on the 1- and 5-year visas',
      documents: 'Passport bio page and a recent photo.',
      notes: 'Cannot be extended or converted. Mountaineering expeditions also need clearance from the Indian Mountaineering Foundation.',
    },
    {
      name: 'e-Business Visa', code: 'e-B1 V', purpose: 'Business',
      summary: 'Meetings, trade, recruiting, setting up a venture, lectures and conferences.',
      subPurposes: 'Business or technical meetings\nSale, purchase or trade\nSetting up an industrial or business venture\nRecruiting staff\nExhibitions and trade fairs\nLectures under the Global Initiative for Academic Networks (GIAN)\nConferences and seminars (e-Conference)\nFilm shoots, with Ministry of Information & Broadcasting clearance',
      validity: '1 year from grant',
      entries: 'Multiple',
      stay: 'Up to 180 days per visit; register with the FRRO/FRO to stay longer',
      documents: 'Business card, plus details of the Indian company you are visiting. An invitation letter from the Indian company can stand in for a business card.',
      notes: 'Employment in India is not allowed. For conferences, the organiser uploads the event to conference.mha.gov.in; the visa runs 30 days from arrival.',
    },
    {
      name: 'e-Medical Visa', code: 'e-M1 V', purpose: 'Medical',
      summary: 'Medical treatment at a hospital in India.',
      subPurposes: 'Treatment at a recognised hospital or treatment centre',
      validity: 'Check the official portal; its category notes and FAQ give different periods',
      entries: 'Multiple',
      stay: '',
      documents: 'Letter from the hospital on its letterhead, with a tentative admission date, patient name, nationality and passport number.',
      notes: 'Up to two e-Medical Attendant visas can be granted per patient. Apply at least 4 days before arrival.',
    },
    {
      name: 'e-Medical Attendant Visa', code: 'e-M2 V', purpose: 'Medical',
      summary: 'Family members or companions travelling with an e-Medical visa holder.',
      subPurposes: 'Accompanying a patient who holds an e-Medical visa',
      validity: 'Linked to the patient’s e-Medical visa',
      entries: 'Multiple',
      stay: '',
      documents: 'Details of the patient’s e-Medical visa application.',
      notes: 'A maximum of two attendants per patient.',
    },
    {
      name: 'e-Student Visa', code: 'e-S V', purpose: 'Study',
      summary: 'Studying at an educational institution in India.',
      subPurposes: 'Enrolled study at a recognised institution',
      validity: '1 year from grant',
      entries: 'Multiple',
      stay: '',
      documents: 'Admission letter from the institution, plus proof of financial support such as a parent’s letter or bank statements.',
      notes: '',
    },
    {
      name: 'e-Family Visa', code: 'e-SX V', purpose: 'Study',
      summary: 'Dependants of an e-Student visa holder.',
      subPurposes: 'Accompanying a family member who holds an e-Student visa',
      validity: '1 year from grant',
      entries: 'Multiple',
      stay: '',
      documents: 'Details of the student’s e-Student visa.',
      notes: '',
    },
    {
      name: 'e-Transit Visa', code: 'e-TR V', purpose: 'Transit',
      summary: 'Passing through India on the way to another country.',
      subPurposes: 'Transit to a third country',
      validity: '30 days from first arrival',
      entries: 'Multiple',
      stay: '',
      documents: 'Onward ticket to your destination.',
      notes: '',
    },
    {
      name: 'e-Miscellaneous Visa', code: 'e-X1 V', purpose: 'Other',
      summary: 'Persons of Indian origin and their family members (e-Entry), and other listed purposes.',
      subPurposes: 'e-Entry for persons of Indian origin and relatives\nProduction investment',
      validity: '3 months from first entry (e-Entry)',
      entries: 'Multiple',
      stay: '',
      documents: 'Proof of Indian origin or relationship, depending on the sub-category.',
      notes: '',
    },
  ]),

  ports: ordered([
    ...['Ahmedabad', 'Amritsar', 'Bagdogra', 'Bengaluru', 'Bhogapuram', 'Bhopal', 'Bhubaneswar', 'Calicut', 'Chandigarh', 'Chennai', 'Cochin', 'Coimbatore', 'Delhi', 'Gaya', 'Goa (Dabolim)', 'Goa (Mopa)', 'Guwahati', 'Hyderabad', 'Indore', 'Jaipur', 'Kannur', 'Kolkata', 'Lucknow', 'Madurai', 'Mangalore', 'Mumbai', 'Nagpur', 'Navi Mumbai', 'Port Blair', 'Pune', 'Surat', 'Thiruvananthapuram', 'Tirupati', 'Trichy', 'Varanasi', 'Vijayawada', 'Visakhapatnam']
      .map((name) => ({ name, portType: 'Airport' })),
    ...['Agatti', 'Alang', 'Bedi Bandar', 'Bhavnagar', 'Calicut', 'Chennai', 'Cochin', 'Cuddalore', 'Dahej', 'Dhamra', 'Haldia', 'Hazira', 'Kakinada', 'Kamarajar', 'Kandla', 'Karaikal', 'Kattupalli', 'Kolkata', 'Kollam', 'Krishnapatnam', 'Mandvi', 'Mormugao', 'Mumbai', 'Mundra', 'Nagapattinam', 'New Mangalore', 'Nhava Sheva', 'Paradeep', 'Pipavav', 'Porbandar', 'Port Blair', 'Sikka', 'Tuna Tekra', 'Tuticorin', 'Vallarpadam', 'Visakhapatnam', 'Vizhinjam', 'Vizhinjam International']
      .map((name) => ({ name, portType: 'Seaport' })),
    ...['Agartala', 'Attari', 'Darranga', 'Dawki', 'Gede', 'Ghojadanga', 'Haridaspur', 'Jaigaon', 'Jogbani', 'Moreh', 'Raxaul', 'Rupaidiha']
      .map((name) => ({ name, portType: 'Land port' })),
  ]),

  checklist: ordered([
    { name: 'Passport valid for 6 months', detail: 'Counted from the date you apply, with at least two blank pages.' },
    { name: 'Recent photo', detail: 'JPEG, 10 KB to 1 MB, plain light or white background, full face, no glasses.' },
    { name: 'Passport bio page scan', detail: 'PDF, 10 KB to 300 KB.' },
    { name: 'Return or onward ticket', detail: 'And enough money to cover your stay.' },
    { name: 'Documents for your visa type', detail: 'For example a business card, hospital letter or admission letter. All documents must be in English.' },
    { name: 'Time before you travel', detail: 'Apply at least 4 days before arrival and no more than 120 days ahead.' },
  ]),

  faqs: ordered([
    { name: 'When should I apply?', topic: 'Applying', answer: 'At least 4 days before you arrive in India, and no more than 120 days ahead.' },
    { name: 'Can I save the form and finish it later?', topic: 'Applying', answer: 'Yes. Choose “Continue a saved application” and pick up where you left off.' },
    { name: 'Who can’t use an e-Visa?', topic: 'Applying', answer: 'Holders of diplomatic or official passports, Pakistani passport holders and people of Pakistani origin, people endorsed on a parent’s or spouse’s passport, and holders of travel documents other than a passport. They need a regular visa.' },
    { name: 'Does my child need a separate e-Visa?', topic: 'Applying', answer: 'Yes. Each child needs their own e-Visa, and their passport must be valid for at least 6 months from arrival.' },
    { name: 'Can I extend or convert my e-Visa?', topic: 'Applying', answer: 'No. An e-Visa can’t be extended or converted to another visa type.' },
    { name: 'Can I work or volunteer on an e-Visa?', topic: 'Applying', answer: 'Employment is not allowed; apply for a regular visa. Voluntary work of up to one month is allowed on an e-Tourist visa.' },
    { name: 'Are there emergency or express fees?', topic: 'Payment', answer: 'No. The only charge is the country-specific e-Visa fee plus bank charges. Anyone offering a faster grant for extra money is not the Government of India.' },
    { name: 'Is the fee refunded if my visa is rejected or I cancel?', topic: 'Payment', answer: 'No. The fee is non-refundable once the application has been submitted.' },
    { name: 'I was charged but my status hasn’t changed.', topic: 'Payment', answer: 'Payment status can take up to 2 hours to update. After that, use “Pay or verify fee”. If a payment fails, clear your browser cookies or try another browser before paying again.' },
    { name: 'Can I pay at the airport?', topic: 'Payment', answer: 'No. The fee is paid online before you travel.' },
    { name: 'What photo and scan do I need?', topic: 'Documents', answer: 'A JPEG photo of 10 KB to 1 MB with a plain light background, full face and no glasses, and a PDF of your passport bio page of 10 KB to 300 KB.' },
    { name: 'What happens if a document is rejected?', topic: 'Documents', answer: 'You’ll get an email asking you to upload it again, normally within 24 hours of submitting. Use “Re-upload documents”.' },
    { name: 'What do I show when I arrive?', topic: 'Travel', answer: 'A printed copy of your ETA showing “GRANTED”. Immigration stamps the e-Visa in your passport and records your biometrics.' },
    { name: 'I have a new passport. Is my ETA still valid?', topic: 'Travel', answer: 'You can travel on the new passport if you also carry the old one the ETA was issued on, or transfer the ETA to the new passport online.' },
    { name: 'Can I enter India by land?', topic: 'Travel', answer: 'The official FAQ says entry is only through designated airports and seaports, while its checkpost list also names land ports. Check the official portal before planning a land crossing.' },
    { name: 'Do I need a yellow fever vaccination card?', topic: 'Travel', answer: 'Yes, if you arrive within 6 days of leaving a yellow-fever-endemic country. Without it you may be quarantined for 6 days.' },
    { name: 'There’s a mistake on my ETA. What should I do?', topic: 'Travel', answer: 'Contact indian-evisa@gov.in or +91 82 7808 7808 at least 24 hours before you travel.' },
  ]),

  helpdesks: ordered([
    { name: 'e-Visa helpdesk', kind: 'e-Visa', phone: '+91 82 7808 7808', email: 'indian-evisa@gov.in', hours: '', note: 'Questions about your application, documents or ETA.' },
    { name: 'SBI ePay', kind: 'Payment', phone: '+91-022-65361671', email: '', hours: '24 × 7', note: 'Card payments carry a 3% charge and PayPal 4%, taxes included. Failed debits are refunded within 7 days.' },
    { name: 'Axis Bank', kind: 'Payment', phone: '+91 1800-419-0073', email: 'ecom@axisbank.com', hours: '24 × 7', note: 'Charges up to 3% plus taxes. Duplicate debits are refunded within 7 days.' },
    { name: 'Razorpay', kind: 'Payment', phone: '+91-022-65361671', email: 'sng-service@razorpay.com', hours: '24 × 7', note: 'Charges are shown at checkout. Refunds go back to the original payment method.' },
  ]),

  links: ordered([
    { name: 'Official e-Visa portal', group: 'Government', url: 'https://indianvisaonline.gov.in/evisa/tvoa.html' },
    { name: 'Bureau of Immigration', group: 'Government', url: 'https://boi.gov.in' },
    { name: 'Ministry of Home Affairs', group: 'Government', url: 'https://www.mha.gov.in' },
    { name: 'Ministry of External Affairs', group: 'Government', url: 'https://www.mea.gov.in' },
    { name: 'Ministry of Tourism', group: 'Government', url: 'https://tourism.gov.in' },
    { name: 'Incredible India', group: 'Government', url: 'https://www.incredibleindia.gov.in' },
    { name: 'FRRO online services', group: 'Government', url: 'https://indianfrro.gov.in' },
    { name: 'e-Tourist visa fees (PDF)', group: 'Documents', url: `${OFFICIAL}images/Etourist_fee_final.pdf` },
    { name: 'Other e-Visa fees (PDF)', group: 'Documents', url: `${OFFICIAL}images/eTV_revised_fee_final.pdf` },
    { name: 'Sample application (PDF)', group: 'Documents', url: `${OFFICIAL}images/SampleForm.pdf` },
  ]),
};

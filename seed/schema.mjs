// Table definitions for the erp.ai app. The seed script creates these; the
// server reads them back by table name and maps each column name to a
// camelCase key ("Port Type" -> portType).

export const APP = {
  name: 'India e-Visa Portal',
  description: 'Content for the India e-Visa portal redesign concept: services, notices, visa types, entry ports, FAQs and helpdesks.',
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  timeZone: 'Asia/Kolkata',
  country: 'IN',
};

const order = { name: 'Order', type: 'number' };

// Every table also gets a 'Name' text column, used as its display field.
export const NAME_COLUMN = { name: 'Name', type: 'text' };

export const TABLES = [
  {
    key: 'services',
    name: 'Services',
    icon: 'ListChecks',
    category: 'Portal',
    description: 'Applicant tasks linked from the hero and task panel.',
    columns: [
      { name: 'Description', type: 'long_text' },
      { name: 'Link', type: 'url' },
      { name: 'Icon', type: 'text' },
      { name: 'Kind', type: 'select', options: ['Primary', 'Task'] },
      order,
    ],
  },
  {
    key: 'notices',
    name: 'Notices',
    icon: 'Megaphone',
    category: 'Portal',
    description: 'Announcements shown under the hero.',
    columns: [
      { name: 'Tag', type: 'text' },
      { name: 'Body', type: 'long_text' },
      { name: 'Link', type: 'url' },
      { name: 'Link Label', type: 'text' },
      order,
    ],
  },
  {
    key: 'visaTypes',
    name: 'Visa Types',
    icon: 'Stamp',
    category: 'Visas',
    description: 'e-Visa categories with purpose and terms.',
    columns: [
      { name: 'Code', type: 'text' },
      { name: 'Purpose', type: 'select', options: ['Tourism', 'Business', 'Medical', 'Study', 'Transit', 'Other'] },
      { name: 'Summary', type: 'long_text' },
      { name: 'Sub Purposes', type: 'long_text' },
      { name: 'Validity', type: 'text' },
      { name: 'Entries', type: 'text' },
      { name: 'Stay', type: 'text' },
      { name: 'Documents', type: 'long_text' },
      { name: 'Notes', type: 'long_text' },
      order,
    ],
  },
  {
    key: 'ports',
    name: 'Entry Ports',
    icon: 'PlaneLanding',
    category: 'Visas',
    description: 'Immigration checkposts where e-Visa holders can enter.',
    columns: [
      { name: 'Port Type', type: 'select', options: ['Airport', 'Seaport', 'Land port'] },
      order,
    ],
  },
  {
    key: 'checklist',
    name: 'Checklist',
    icon: 'ClipboardCheck',
    category: 'Visas',
    description: 'What applicants need before starting the form.',
    columns: [
      { name: 'Detail', type: 'long_text' },
      order,
    ],
  },
  {
    key: 'faqs',
    name: 'FAQs',
    icon: 'CircleHelp',
    category: 'Help',
    description: 'Frequently asked questions.',
    columns: [
      { name: 'Answer', type: 'long_text' },
      { name: 'Topic', type: 'select', options: ['Applying', 'Payment', 'Documents', 'Travel'] },
      order,
    ],
  },
  {
    key: 'helpdesks',
    name: 'Helpdesks',
    icon: 'Headset',
    category: 'Help',
    description: 'Support contacts for applications and payments.',
    columns: [
      { name: 'Kind', type: 'select', options: ['e-Visa', 'Payment'] },
      { name: 'Phone', type: 'text' },
      { name: 'Email', type: 'email' },
      { name: 'Hours', type: 'text' },
      { name: 'Note', type: 'long_text' },
      order,
    ],
  },
  {
    key: 'links',
    name: 'Useful Links',
    icon: 'Link',
    category: 'Help',
    description: 'Related government websites and documents.',
    columns: [
      { name: 'URL', type: 'url' },
      { name: 'Group', type: 'select', options: ['Government', 'Documents'] },
      order,
    ],
  },
];

export const camel = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/[^a-z0-9]/gi, '');

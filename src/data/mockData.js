// ============================================================
// MOCK DATA — Replace with Supabase queries when integrating
// ============================================================

export const mockUsers = [
  { id: 1, name: 'Arghya Bose', email: 'arghya@aakarco.com', role: 'admin', designation: 'Agency Director', status: 'active', avatar: 'AB', joined: '2024-01-15' },
  { id: 2, name: 'Priya Sharma', email: 'priya@aakarco.com', role: 'manager', designation: 'Sales Manager', status: 'active', avatar: 'PS', joined: '2024-02-10' },
  { id: 3, name: 'Rahul Verma', email: 'rahul@aakarco.com', role: 'freelancer', designation: 'Lead Specialist', status: 'active', avatar: 'RV', joined: '2024-03-05' },
  { id: 4, name: 'Sneha Gupta', email: 'sneha@aakarco.com', role: 'freelancer', designation: 'Business Dev', status: 'active', avatar: 'SG', joined: '2024-03-20' },
  { id: 5, name: 'Amit Patel', email: 'amit@aakarco.com', role: 'freelancer', designation: 'Lead Specialist', status: 'suspended', avatar: 'AP', joined: '2024-04-01' },
  { id: 6, name: 'Kavya Nair', email: 'kavya@aakarco.com', role: 'freelancer', designation: 'Sales Executive', status: 'active', avatar: 'KN', joined: '2024-04-15' },
];

export const mockLeads = [
  { id: 1, clientName: 'TechCorp Solutions', phone: '+91 98765 43210', service: 'Web Development', status: 'Converted', date: '2025-05-01', assignedTo: 'Arghya Bose' },
  { id: 2, clientName: 'Sunrise Retail', phone: '+91 87654 32109', service: 'SEO & Marketing', status: 'Follow-up', date: '2025-05-03', assignedTo: 'Arghya Bose' },
  { id: 3, clientName: 'BlueSky Ventures', phone: '+91 76543 21098', service: 'UI/UX Design', status: 'New', date: '2025-05-05', assignedTo: 'Arghya Bose' },
  { id: 4, clientName: 'GreenLeaf Foods', phone: '+91 65432 10987', service: 'Branding', status: 'Converted', date: '2025-04-28', assignedTo: 'Arghya Bose' },
  { id: 5, clientName: 'NovaTech Systems', phone: '+91 54321 09876', service: 'Mobile App', status: 'Follow-up', date: '2025-04-25', assignedTo: 'Arghya Bose' },
  { id: 6, clientName: 'Coastal Hospitality', phone: '+91 43210 98765', service: 'Web Development', status: 'New', date: '2025-05-06', assignedTo: 'Arghya Bose' },
  { id: 7, clientName: 'Pinnacle Education', phone: '+91 32109 87654', service: 'SEO & Marketing', status: 'Converted', date: '2025-04-20', assignedTo: 'Arghya Bose' },
];

export const mockLeaderboard = [
  { id: 1, name: 'Arghya Bose', avatar: 'AB', convertedClients: 18, earnings: 72000, badge: '🥇' },
  { id: 2, name: 'Priya Sharma', avatar: 'PS', convertedClients: 15, earnings: 60000, badge: '🥈' },
  { id: 3, name: 'Rahul Verma', avatar: 'RV', convertedClients: 12, earnings: 48000, badge: '🥉' },
  { id: 4, name: 'Sneha Gupta', avatar: 'SG', convertedClients: 9, earnings: 36000, badge: null },
  { id: 5, name: 'Kavya Nair', avatar: 'KN', convertedClients: 7, earnings: 28000, badge: null },
  { id: 6, name: 'Amit Patel', avatar: 'AP', convertedClients: 4, earnings: 16000, badge: null },
];

export const mockTransactions = [
  { id: 1, description: 'TechCorp Solutions — Web Dev Project', amount: 15000, type: 'credit', status: 'Paid', date: '2025-05-01' },
  { id: 2, description: 'GreenLeaf Foods — Branding Package', amount: 8000, type: 'credit', status: 'Paid', date: '2025-04-28' },
  { id: 3, description: 'Pinnacle Education — SEO Campaign', amount: 12000, type: 'credit', status: 'Paid', date: '2025-04-20' },
  { id: 4, description: 'BlueSky Ventures — UI/UX Project', amount: 18000, type: 'credit', status: 'Pending', date: '2025-05-05' },
  { id: 5, description: 'NovaTech Systems — Mobile App', amount: 19000, type: 'credit', status: 'Pending', date: '2025-04-25' },
];

export const services = [
  'Web Development', 'Mobile App', 'UI/UX Design',
  'SEO & Marketing', 'Branding', 'Social Media', 'Content Writing',
];

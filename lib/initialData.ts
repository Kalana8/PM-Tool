import { User, Department, Project, Task, Attendance, MediaFile, Notification, DailyWorkLog } from './types';

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-webdev',
    name: 'Web Development',
    code: 'WEBDEV',
    icon: 'Code',
    description: 'Full-stack engineering, web application development, and e-commerce architectures.',
    status: 'Active'
  },
  {
    id: 'dept-uiux',
    name: 'UI/UX Design',
    code: 'UIUX',
    icon: 'Palette',
    description: 'User research, wireframing, high-fidelity prototypes, and design systems.',
    status: 'Active'
  },
  {
    id: 'dept-qa',
    name: 'QA Testing',
    code: 'QA',
    icon: 'ShieldCheck',
    description: 'Manual and automated testing, bug hunting, security audits, and performance scaling.',
    status: 'Active'
  },
  {
    id: 'dept-marketing',
    name: 'Digital Marketing',
    code: 'MKT',
    icon: 'Megaphone',
    description: 'SEO optimization, paid campaigns, social media growth, and content strategy.',
    status: 'Active'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Sarah Connor',
    email: 'admin@enterprise.com',
    role: 'Admin',
    departmentId: 'dept-webdev',
    status: 'Active',
    avatar: 'https://picsum.photos/seed/sarah/100/100',
    title: 'Principal Operations Officer',
    performanceScore: 98,
    phone: '+1 (555) 019-2831'
  },
  {
    id: 'user-leader-web',
    name: 'Alex Rivera',
    email: 'alex@enterprise.com',
    role: 'Team Leader',
    departmentId: 'dept-webdev',
    status: 'Active',
    avatar: 'https://picsum.photos/seed/alex/100/100',
    title: 'Engineering Director',
    performanceScore: 94,
    phone: '+1 (555) 014-9921'
  },
  {
    id: 'user-leader-design',
    name: 'Elena Rostova',
    email: 'elena@enterprise.com',
    role: 'Team Leader',
    departmentId: 'dept-uiux',
    status: 'Active',
    avatar: 'https://picsum.photos/seed/elena/100/100',
    title: 'Design Director',
    performanceScore: 96,
    phone: '+1 (555) 018-4491'
  },
  {
    id: 'user-leader-qa',
    name: 'Marcus Vance',
    email: 'marcus@enterprise.com',
    role: 'Team Leader',
    departmentId: 'dept-qa',
    status: 'Active',
    avatar: 'https://picsum.photos/seed/marcus/100/100',
    title: 'Quality Assurance Head',
    performanceScore: 92,
    phone: '+1 (555) 011-3329'
  },
  {
    id: 'user-member-david',
    name: 'David Kim',
    email: 'david@enterprise.com',
    role: 'Team Member',
    departmentId: 'dept-webdev',
    status: 'Active',
    avatar: 'https://picsum.photos/seed/david/100/100',
    title: 'Senior Frontend Engineer',
    performanceScore: 91,
    phone: '+1 (555) 015-8822',
    teamLeaderId: 'user-leader-web'
  },
  {
    id: 'user-member-chloe',
    name: 'Chloe Chen',
    email: 'chloe@enterprise.com',
    role: 'Team Member',
    departmentId: 'dept-webdev',
    status: 'Active',
    avatar: 'https://picsum.photos/seed/chloe/100/100',
    title: 'Backend Engineer',
    performanceScore: 89,
    phone: '+1 (555) 012-7744',
    teamLeaderId: 'user-leader-web'
  },
  {
    id: 'user-member-liam',
    name: 'Liam O\'Connor',
    email: 'liam@enterprise.com',
    role: 'Team Member',
    departmentId: 'dept-uiux',
    status: 'Active',
    avatar: 'https://picsum.photos/seed/liam/100/100',
    title: 'Product Designer',
    performanceScore: 95,
    phone: '+1 (555) 017-3311',
    teamLeaderId: 'user-leader-design'
  },
  {
    id: 'user-member-sophia',
    name: 'Sophia Patel',
    email: 'sophia@enterprise.com',
    role: 'Team Member',
    departmentId: 'dept-uiux',
    status: 'Active',
    avatar: 'https://picsum.photos/seed/sophia/100/100',
    title: 'UI Visual Specialist',
    performanceScore: 88,
    phone: '+1 (555) 016-5599',
    teamLeaderId: 'user-leader-design'
  },
  {
    id: 'user-member-jaxon',
    name: 'Jaxon Reed',
    email: 'jaxon@enterprise.com',
    role: 'Team Member',
    departmentId: 'dept-qa',
    status: 'Active',
    avatar: 'https://picsum.photos/seed/jaxon/100/100',
    title: 'SDET Automation Engineer',
    performanceScore: 87,
    phone: '+1 (555) 013-1122',
    teamLeaderId: 'user-leader-qa'
  }
];

export const INITIAL_MEDIA: MediaFile[] = [
  {
    id: 'media-1',
    name: 'Brand Identity Design System.pdf',
    type: 'document',
    url: '#',
    size: '14.2 MB',
    extension: 'PDF',
    uploadedBy: 'Elena Rostova',
    dateAdded: '2026-07-01',
    projectId: 'proj-designsys',
    departmentId: 'dept-uiux'
  },
  {
    id: 'media-2',
    name: 'Homepage Hero Interaction.mp4',
    type: 'video',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4', // public fallback MP4
    size: '48.5 MB',
    extension: 'MP4',
    uploadedBy: 'Liam O\'Connor',
    dateAdded: '2026-07-04',
    projectId: 'proj-portal',
    departmentId: 'dept-uiux'
  },
  {
    id: 'media-3',
    name: 'Mobile App Mockups Showcase.jpg',
    type: 'image',
    url: 'https://picsum.photos/seed/showcase/800/600',
    size: '4.8 MB',
    extension: 'JPG',
    uploadedBy: 'Sophia Patel',
    dateAdded: '2026-07-05',
    projectId: 'proj-portal',
    departmentId: 'dept-uiux'
  },
  {
    id: 'media-4',
    name: 'Database Schema Architectural Diagram.png',
    type: 'image',
    url: 'https://picsum.photos/seed/schema/800/600',
    size: '2.1 MB',
    extension: 'PNG',
    uploadedBy: 'Chloe Chen',
    dateAdded: '2026-07-02',
    projectId: 'proj-portal',
    departmentId: 'dept-webdev'
  },
  {
    id: 'media-5',
    name: 'Load Testing Report V1.0.docx',
    type: 'document',
    url: '#',
    size: '1.8 MB',
    extension: 'DOCX',
    uploadedBy: 'Jaxon Reed',
    dateAdded: '2026-07-06',
    projectId: 'proj-ecom',
    departmentId: 'dept-qa'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-portal',
    name: 'Company Website Redesign',
    departmentId: 'dept-webdev',
    description: 'Transforming the corporate portal into an interactive, lightning-fast showcase using Next.js, Framer Motion, and global CDN caching.',
    startDate: '2026-06-01',
    deadline: '2026-08-15',
    status: 'In Progress',
    progress: 68,
    leaderId: 'user-leader-web',
    assigneeId: 'user-member-david',
    members: ['user-member-david', 'user-member-chloe', 'user-member-liam'],
    documents: [INITIAL_MEDIA[3]],
    images: [INITIAL_MEDIA[2]],
    videos: [INITIAL_MEDIA[1]],
    notes: [
      'Frontend uses standard Tailwind and Framer Motion.',
      'API routing must have a rate-limiter setup.',
      'Target performance score of 95+ on Lighthouse.'
    ]
  },
  {
    id: 'proj-ecom',
    name: 'E-commerce Checkout Core',
    departmentId: 'dept-webdev',
    description: 'Re-engineering the checkout engine to support local payment gateways, sub-second latency, and advanced cart abandon mechanisms.',
    startDate: '2026-07-01',
    deadline: '2026-09-30',
    status: 'Planning',
    progress: 25,
    leaderId: 'user-leader-web',
    assigneeId: 'user-member-chloe',
    members: ['user-member-david', 'user-member-chloe', 'user-member-jaxon'],
    documents: [INITIAL_MEDIA[4]],
    images: [],
    videos: [],
    notes: [
      'Compliance with PCI-DSS Level 1 is mandatory.',
      'Stripe & PayPal API configurations are finalized.'
    ]
  },
  {
    id: 'proj-designsys',
    name: 'Atlas Enterprise Design System',
    departmentId: 'dept-uiux',
    description: 'Constructing the standard component libraries, color palettes, spacing hierarchies, and interactions for all enterprise platforms.',
    startDate: '2026-05-15',
    deadline: '2026-07-25',
    status: 'In Progress',
    progress: 85,
    leaderId: 'user-leader-design',
    assigneeId: 'user-member-liam',
    members: ['user-member-liam', 'user-member-sophia'],
    documents: [INITIAL_MEDIA[0]],
    images: [],
    videos: [],
    notes: [
      'Tailwind CSS v4 config template is completed.',
      'Accessibility review is scheduled for mid-July.'
    ]
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    name: 'Refactor Checkout Payment Interface',
    projectId: 'proj-ecom',
    departmentId: 'dept-webdev',
    category: 'continuous',
    description: 'Implement a highly secure payment routing client component with multi-currency selector and instant error bounds.',
    priority: 'High',
    status: 'In Progress',
    progress: 40,
    dueDate: '2026-07-15',
    assignedTo: 'user-member-david',
    milestones: [
      { id: 'm-1', title: 'Layout Construction', completed: true, dueDate: '2026-07-08' },
      { id: 'm-2', title: 'Stripe Gateway Testing', completed: false, dueDate: '2026-07-12' },
      { id: 'm-3', title: 'QA Verification', completed: false, dueDate: '2026-07-15' }
    ],
    comments: [
      {
        id: 'c-1',
        userName: 'Alex Rivera',
        userAvatar: 'https://picsum.photos/seed/alex/100/100',
        text: 'Make sure to validate the token payload server-side using cryptographic guards.',
        timestamp: '2026-07-05 10:14'
      }
    ],
    submissions: []
  },
  {
    id: 'task-2',
    name: 'Assemble Component Token Registry',
    projectId: 'proj-designsys',
    departmentId: 'dept-uiux',
    category: 'continuous',
    description: 'Generate JSON files with token names and hex keys, exporting them directly to CSS variables for light/dark templates.',
    priority: 'Medium',
    status: 'Review',
    progress: 100,
    dueDate: '2026-07-10',
    assignedTo: 'user-member-liam',
    milestones: [
      { id: 'm-4', title: 'Define Colors', completed: true, dueDate: '2026-07-03' },
      { id: 'm-5', title: 'Write Compiler Script', completed: true, dueDate: '2026-07-07' }
    ],
    comments: [],
    submissions: [
      {
        id: 'sub-2',
        userId: 'user-member-liam',
        userName: 'Liam O\'Connor',
        date: '2026-07-06 17:30',
        workDone: 'Successfully exported color token libraries and completed automated validation scripts. All tests are positive.',
        notes: 'Files uploaded to the design system media archive.',
        status: 'Pending',
        attachments: [INITIAL_MEDIA[0]]
      }
    ]
  },
  {
    id: 'task-3',
    name: 'Verify API Rate-Limiting Protocol',
    projectId: 'proj-portal',
    departmentId: 'dept-webdev',
    category: 'daily',
    description: 'Construct Redis-based rate limiting tests, simulating 10,000 requests per minute. Report the breakdown of HTTP 429 anomalies.',
    priority: 'High',
    status: 'Todo',
    progress: 0,
    dueDate: '2026-07-07',
    assignedTo: 'user-member-chloe',
    comments: [],
    submissions: []
  },
  {
    id: 'task-4',
    name: 'Construct Design System Accent Layouts',
    projectId: 'proj-designsys',
    departmentId: 'dept-uiux',
    category: 'daily',
    description: 'Design dark-mode variants for the dashboard sidebar rails, project timelines, and bento grids.',
    priority: 'Low',
    status: 'Completed',
    progress: 100,
    dueDate: '2026-07-06',
    assignedTo: 'user-member-sophia',
    comments: [
      {
        id: 'c-2',
        userName: 'Elena Rostova',
        userAvatar: 'https://picsum.photos/seed/elena/100/100',
        text: 'This looks stunningly clean! Approved, let us transition this directly to the main system repo.',
        timestamp: '2026-07-06 14:15'
      }
    ],
    submissions: []
  },
  {
    id: 'task-5',
    name: 'Automate E-commerce End-to-End Cart Flow',
    projectId: 'proj-ecom',
    departmentId: 'dept-qa',
    category: 'continuous',
    description: 'Construct automated Playwright scripts ensuring cart persistence across page refreshes and multi-tab sessions.',
    priority: 'High',
    status: 'In Progress',
    progress: 60,
    dueDate: '2026-07-20',
    assignedTo: 'user-member-jaxon',
    milestones: [
      { id: 'm-6', title: 'Write selectors mapping', completed: true, dueDate: '2026-07-12' },
      { id: 'm-7', title: 'Run local test harness', completed: false, dueDate: '2026-07-20' }
    ],
    comments: [],
    submissions: []
  }
];

export const INITIAL_ATTENDANCE: Attendance[] = [
  {
    id: 'att-1',
    userId: 'user-member-david',
    date: '2026-07-06',
    checkInTime: '08:52:11',
    checkOutTime: '17:34:25',
    status: 'Present',
    workingHours: 8.7
  },
  {
    id: 'att-2',
    userId: 'user-member-chloe',
    date: '2026-07-06',
    checkInTime: '09:12:05',
    checkOutTime: '18:02:14',
    status: 'Present',
    workingHours: 8.8
  },
  {
    id: 'att-3',
    userId: 'user-member-liam',
    date: '2026-07-06',
    checkInTime: '09:48:22',
    checkOutTime: '17:15:30',
    status: 'Late',
    workingHours: 7.45
  },
  {
    id: 'att-4',
    userId: 'user-member-sophia',
    date: '2026-07-06',
    checkInTime: '08:44:11',
    checkOutTime: '17:00:00',
    status: 'Present',
    workingHours: 8.25
  },
  {
    id: 'att-5',
    userId: 'user-leader-web',
    date: '2026-07-06',
    checkInTime: '08:31:04',
    checkOutTime: '18:15:44',
    status: 'Present',
    workingHours: 9.75
  },
  {
    id: 'att-6',
    userId: 'user-member-david',
    date: '2026-07-07',
    checkInTime: '08:58:34',
    status: 'Present'
  },
  {
    id: 'att-7',
    userId: 'user-member-liam',
    date: '2026-07-07',
    checkInTime: '10:02:44',
    status: 'Late'
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'not-1',
    userId: 'all',
    title: 'New System Portal Released',
    message: 'The Enterprise Project Redesign is officially in transition. Check out details.',
    type: 'new_project',
    time: '2 hours ago',
    read: false
  },
  {
    id: 'not-2',
    userId: 'user-member-david',
    title: 'High Priority Task Assigned',
    message: 'Alex Rivera assigned: "Refactor Checkout Payment Interface"',
    type: 'task_assigned',
    time: '1 day ago',
    read: false
  },
  {
    id: 'not-3',
    userId: 'user-leader-design',
    title: 'Task Submission for Review',
    message: 'Liam O\'Connor submitted work for "Assemble Component Token Registry"',
    type: 'task_completed',
    time: '1 day ago',
    read: false
  },
  {
    id: 'not-4',
    userId: 'user-member-sophia',
    title: 'Task Approved',
    message: 'Elena Rostova approved: "Construct Design System Accent Layouts"',
    type: 'task_approved',
    time: 'Yesterday',
    read: true
  }
];

export const INITIAL_WORKLOGS: DailyWorkLog[] = [
  {
    id: 'log-1',
    userId: 'user-member-sophia',
    userName: 'Sophia Patel',
    date: '2026-07-06',
    tasksDone: 'Finished high-fidelity dark variants for bento widgets, projects timelines and dashboard components.',
    problems: 'Need clarifications on brand styling standards for specific analytics sliders.',
    notes: 'Uploaded visual deliverables to the shared cloud folders.',
    attachments: [INITIAL_MEDIA[2]]
  }
];

// LocalStorage helpers to simulate database operations in frontend high-fidelity prototype
export const getStoredData = () => {
  if (typeof window === 'undefined') {
    return {
      departments: INITIAL_DEPARTMENTS,
      users: INITIAL_USERS,
      projects: INITIAL_PROJECTS,
      tasks: INITIAL_TASKS,
      attendance: INITIAL_ATTENDANCE,
      media: INITIAL_MEDIA,
      notifications: INITIAL_NOTIFICATIONS,
      worklogs: INITIAL_WORKLOGS
    };
  }

  const load = <T>(key: string, fallback: T): T => {
    const data = localStorage.getItem(`enterprise_system_${key}`);
    return data ? JSON.parse(data) : fallback;
  };

  return {
    departments: load('departments', INITIAL_DEPARTMENTS),
    users: load('users', INITIAL_USERS),
    projects: load('projects', INITIAL_PROJECTS),
    tasks: load('tasks', INITIAL_TASKS),
    attendance: load('attendance', INITIAL_ATTENDANCE),
    media: load('media', INITIAL_MEDIA),
    notifications: load('notifications', INITIAL_NOTIFICATIONS),
    worklogs: load('worklogs', INITIAL_WORKLOGS)
  };
};

export const saveStoredData = (data: {
  departments: Department[];
  users: User[];
  projects: Project[];
  tasks: Task[];
  attendance: Attendance[];
  media: MediaFile[];
  notifications: Notification[];
  worklogs: DailyWorkLog[];
}) => {
  if (typeof window === 'undefined') return;
  Object.entries(data).forEach(([key, val]) => {
    localStorage.setItem(`enterprise_system_${key}`, JSON.stringify(val));
  });
};

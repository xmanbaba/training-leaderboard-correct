import { UserCheck, MessageCircle, CheckSquare, Heart, AlertTriangle } from 'lucide-react';

export const mockTrainings = [
  {
    id: 1,
    name: "Leadership Excellence Program",
    topic: "Leadership Development",
    cohort: "Cohort Alpha",
    startDate: "2025-09-15",
    endDate: "2025-10-15",
    participantCount: 24,
    status: "active"
  },
  {
    id: 2,
    name: "Digital Marketing Mastery",
    topic: "Marketing Strategy",
    cohort: "Cohort Beta",
    startDate: "2025-10-01",
    endDate: "2025-11-01",
    participantCount: 18,
    status: "upcoming"
  }
];

export const mockParticipants = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.j@company.com",
    phone: "+1234567890",
    department: "Marketing",
    groupId: 1,
    scores: {
      attendance: 5,
      questions_asked: 4,
      questions_answered: 3,
      project_completion: 4,
      support_others: 5,
      disruption: -1,
      late_arrival: 0
    },
    totalScore: 20
  },
  {
    id: 2,
    name: "Mike Chen",
    email: "mike.c@company.com",
    phone: "+1234567891",
    department: "Engineering",
    groupId: 1,
    scores: {
      attendance: 4,
      questions_asked: 5,
      questions_answered: 5,
      project_completion: 3,
      support_others: 4,
      disruption: 0,
      late_arrival: -2
    },
    totalScore: 19
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    email: "emma.r@company.com",
    phone: "+1234567892",
    department: "Sales",
    groupId: 2,
    scores: {
      attendance: 5,
      questions_asked: 3,
      questions_answered: 4,
      project_completion: 5,
      support_others: 3,
      disruption: 0,
      late_arrival: 0
    },
    totalScore: 20
  },
  {
    id: 4,
    name: "David Kim",
    email: "david.k@company.com",
    phone: "+1234567893",
    department: "HR",
    groupId: 2,
    scores: {
      attendance: 3,
      questions_asked: 2,
      questions_answered: 3,
      project_completion: 2,
      support_others: 2,
      disruption: -3,
      late_arrival: -1
    },
    totalScore: 8
  }
];

export const mockGroups = [
  { id: 1, name: "Team Alpha", participantIds: [1, 2], totalScore: 39 },
  { id: 2, name: "Team Beta", participantIds: [3, 4], totalScore: 28 }
];

export const scoringCategories = {
  positive: {
    attendance: { 
      name: "Attendance", 
      icon: UserCheck, 
      description: "Showing up, coming early" 
    },
    questions_asked: { 
      name: "Asking Questions", 
      icon: MessageCircle, 
      description: "Active participation through questions" 
    },
    questions_answered: { 
      name: "Answering Questions", 
      icon: MessageCircle, 
      description: "Contributing knowledge" 
    },
    project_completion: { 
      name: "Project Completion", 
      icon: CheckSquare, 
      description: "Finishing assigned tasks" 
    },
    support_others: { 
      name: "Supporting Others", 
      icon: Heart, 
      description: "Helping fellow participants" 
    }
  },
  negative: {
    disruption: { 
      name: "Disruption", 
      icon: AlertTriangle, 
      description: "Disruptive behavior" 
    },
    late_arrival: { 
      name: "Late Arrival", 
      icon: AlertTriangle, 
      description: "Arriving late" 
    },
    inappropriate_behavior: { 
      name: "Inappropriate Behavior", 
      icon: AlertTriangle, 
      description: "Unprofessional conduct" 
    },
    non_participation: { 
      name: "Non-participation", 
      icon: AlertTriangle, 
      description: "Not engaging in activities" 
    }
  }
};
import SwiftUI

// MARK: - Mock Data Service

struct MockDataService {

    // MARK: - Courses

    static let courses: [Course] = [
        Course(id: UUID(), name: "Introduction to Computer Science", code: "CS 101",
               color: .mailBlue, instructor: "Dr. Alan Turing",
               assignmentCount: 8, pendingCount: 2),
        Course(id: UUID(), name: "Calculus II", code: "MATH 152",
               color: Color(red: 0.6, green: 0.3, blue: 0.9), instructor: "Prof. Sarah Kim",
               assignmentCount: 12, pendingCount: 3),
        Course(id: UUID(), name: "Technical Writing", code: "ENG 210",
               color: .calendarGreen, instructor: "Dr. Maya Patel",
               assignmentCount: 6, pendingCount: 1),
        Course(id: UUID(), name: "Data Structures", code: "CS 201",
               color: .canvasRed, instructor: "Prof. James Chen",
               assignmentCount: 10, pendingCount: 4),
    ]

    // MARK: - Assignments

    static let assignments: [Assignment] = {
        let now = Date.now
        let cal = Calendar.current
        return [
            Assignment(id: UUID(), title: "Binary Search Tree Implementation",
                       course: "CS 201", courseColor: .canvasRed,
                       dueDate: cal.date(byAdding: .hour, value: 6, to: now)!,
                       points: 100, status: .upcoming,
                       description: "Implement a full binary search tree with insert, delete, and search operations."),
            Assignment(id: UUID(), title: "Integral Applications Problem Set",
                       course: "MATH 152", courseColor: Color(red: 0.6, green: 0.3, blue: 0.9),
                       dueDate: cal.date(byAdding: .day, value: 1, to: now)!,
                       points: 50, status: .upcoming,
                       description: "Complete problems 4.1–4.8 on areas between curves and volume of revolution."),
            Assignment(id: UUID(), title: "Tech Report Draft",
                       course: "ENG 210", courseColor: .calendarGreen,
                       dueDate: cal.date(byAdding: .day, value: 3, to: now)!,
                       points: 75, status: .upcoming,
                       description: "Submit the first draft of your technical report. Focus on structure and clarity."),
            Assignment(id: UUID(), title: "Algorithm Analysis Essay",
                       course: "CS 101", courseColor: .mailBlue,
                       dueDate: cal.date(byAdding: .day, value: -1, to: now)!,
                       points: 60, status: .missing,
                       description: "Write a 500-word analysis comparing O(n log n) sorting algorithms."),
            Assignment(id: UUID(), title: "Hash Table Lab",
                       course: "CS 201", courseColor: .canvasRed,
                       dueDate: cal.date(byAdding: .day, value: 5, to: now)!,
                       points: 80, status: .submitted,
                       description: "Implement open addressing and chaining hash tables."),
            Assignment(id: UUID(), title: "Midterm Review Quiz",
                       course: "MATH 152", courseColor: Color(red: 0.6, green: 0.3, blue: 0.9),
                       dueDate: cal.date(byAdding: .day, value: 7, to: now)!,
                       points: 20, status: .upcoming,
                       description: "Online quiz covering chapters 3-5."),
            Assignment(id: UUID(), title: "Recursive Algorithms",
                       course: "CS 101", courseColor: .mailBlue,
                       dueDate: cal.date(byAdding: .day, value: 4, to: now)!,
                       points: 90, status: .graded,
                       description: "Implement and analyze recursive solutions."),
        ]
    }()

    // MARK: - Canvas Events

    static let canvasEvents: [CanvasEvent] = {
        let now = Date.now
        let cal = Calendar.current
        return [
            CanvasEvent(id: UUID(), title: "CS 201 Midterm Exam", course: "CS 201",
                        courseColor: .canvasRed,
                        startDate: cal.date(byAdding: .day, value: 2, to: now)!,
                        endDate: cal.date(byAdding: .hour, value: 2,
                                          to: cal.date(byAdding: .day, value: 2, to: now)!)!,
                        location: "Room 204, Tech Building", type: .exam),
            CanvasEvent(id: UUID(), title: "Office Hours – Prof. Chen", course: "CS 201",
                        courseColor: .canvasRed,
                        startDate: cal.date(byAdding: .hour, value: 3, to: now)!,
                        endDate: cal.date(byAdding: .hour, value: 5, to: now)!,
                        location: "Online (Zoom)", type: .office),
            CanvasEvent(id: UUID(), title: "MATH 152 Quiz", course: "MATH 152",
                        courseColor: Color(red: 0.6, green: 0.3, blue: 0.9),
                        startDate: cal.date(byAdding: .day, value: 1, to: now)!,
                        endDate: nil, location: nil, type: .quiz),
            CanvasEvent(id: UUID(), title: "ENG 210 Peer Review", course: "ENG 210",
                        courseColor: .calendarGreen,
                        startDate: cal.date(byAdding: .day, value: 4, to: now)!,
                        endDate: nil, location: "Room 101", type: .meeting),
        ]
    }()

    // MARK: - Mail Messages

    static let mailMessages: [MailMessage] = {
        let now = Date.now
        let cal = Calendar.current
        return [
            MailMessage(id: UUID(), sender: "Prof. James Chen", senderInitials: "JC",
                        senderColor: .canvasRed,
                        subject: "Midterm Exam Details – CS 201",
                        preview: "Please review the attached study guide. The exam will cover chapters 1-7...",
                        body: """
Hi everyone,

The CS 201 midterm will take place in Room 204 on Thursday. Please bring a pencil and your student ID.

Topics covered:
- Arrays and Linked Lists
- Trees and Graphs
- Sorting and Searching
- Time Complexity Analysis

A study guide is attached. Office hours are extended this week: Mon/Wed 3–5 PM.

Good luck!
Prof. Chen
""",
                        date: cal.date(byAdding: .hour, value: -2, to: now)!,
                        isRead: false, isStarred: true, hasAttachment: true, category: .school),

            MailMessage(id: UUID(), sender: "Canvas Notifications", senderInitials: "CN",
                        senderColor: Color(red: 0.92, green: 0.26, blue: 0.21),
                        subject: "Assignment Graded: Recursive Algorithms",
                        preview: "Your submission has been graded. You received 87/90 points...",
                        body: "Your submission for 'Recursive Algorithms' has been graded.\n\nScore: 87/90\nFeedback: Great work overall! Minor deduction for missing edge case in the Fibonacci implementation.",
                        date: cal.date(byAdding: .hour, value: -5, to: now)!,
                        isRead: false, isStarred: false, hasAttachment: false, category: .school),

            MailMessage(id: UUID(), sender: "University Library", senderInitials: "UL",
                        senderColor: .calendarGreen,
                        subject: "Your holds are ready for pickup",
                        preview: "3 items are available at the main desk. Items will be held until...",
                        body: "The following items are ready for pickup at the Main Library desk:\n\n1. Introduction to Algorithms – Cormen et al.\n2. The Pragmatic Programmer\n3. Clean Code – Robert Martin\n\nItems will be held for 7 days.",
                        date: cal.date(byAdding: .day, value: -1, to: now)!,
                        isRead: true, isStarred: false, hasAttachment: false, category: .primary),

            MailMessage(id: UUID(), sender: "Dr. Sarah Kim", senderInitials: "SK",
                        senderColor: Color(red: 0.6, green: 0.3, blue: 0.9),
                        subject: "Calculus II – Problem Set 6 Posted",
                        preview: "Problem Set 6 is now available on Canvas. Due date: next Friday...",
                        body: "Hi class,\n\nProblem Set 6 on integration by parts and trigonometric substitution is now live on Canvas.\n\nDue: Friday at 11:59 PM\n\nPlease start early – these problems require careful setup.\n\nBest,\nDr. Kim",
                        date: cal.date(byAdding: .hour, value: -8, to: now)!,
                        isRead: false, isStarred: false, hasAttachment: false, category: .school),

            MailMessage(id: UUID(), sender: "GitHub", senderInitials: "GH",
                        senderColor: Color(white: 0.8),
                        subject: "New pull request: fix/binary-tree-null-check",
                        preview: "A new pull request has been opened in your repository...",
                        body: "A new pull request has been opened.\n\nRepo: cs201-lab/binary-search-tree\nTitle: fix/binary-tree-null-check\nAuthor: alex_dev\n\nView on GitHub →",
                        date: cal.date(byAdding: .day, value: -1, to: now)!,
                        isRead: true, isStarred: false, hasAttachment: false, category: .updates),

            MailMessage(id: UUID(), sender: "Maya Patel", senderInitials: "MP",
                        senderColor: .calendarGreen,
                        subject: "Re: Tech Report Feedback",
                        preview: "Your outline looks great! A few suggestions before you write the full draft...",
                        body: "Hi,\n\nYour outline is well-structured. A few notes:\n\n1. Expand Section 2 with more technical detail\n2. Add a glossary for non-technical readers\n3. The conclusion needs a stronger call-to-action\n\nLooking forward to the full draft!\n\nDr. Patel",
                        date: cal.date(byAdding: .day, value: -2, to: now)!,
                        isRead: true, isStarred: true, hasAttachment: false, category: .school),

            MailMessage(id: UUID(), sender: "Spotify", senderInitials: "SP",
                        senderColor: Color(red: 0.11, green: 0.73, blue: 0.33),
                        subject: "Your Wrapped is ready 🎧",
                        preview: "See your year in music. You listened to 47,000 minutes...",
                        body: "Your 2025 Wrapped is here!\n\nYou listened to 47,000 minutes of music this year. Your top genre was Lo-fi Hip Hop. Tap to see more.",
                        date: cal.date(byAdding: .day, value: -3, to: now)!,
                        isRead: true, isStarred: false, hasAttachment: false, category: .social),
        ]
    }()

    // MARK: - Calendar Events

    static let calendarEvents: [CalendarEvent] = {
        let now = Date.now
        let cal = Calendar.current
        let startOfDay = cal.startOfDay(for: now)
        return [
            CalendarEvent(id: UUID(), title: "Study Group – CS 201",
                          startDate: cal.date(bySettingHour: 10, minute: 0, second: 0, of: now)!,
                          endDate: cal.date(bySettingHour: 12, minute: 0, second: 0, of: now)!,
                          isAllDay: false, color: .canvasRed,
                          calendar: "School", location: "Library Room 3B", notes: nil, recurrence: .weekly),
            CalendarEvent(id: UUID(), title: "Lunch with Alex",
                          startDate: cal.date(bySettingHour: 12, minute: 30, second: 0, of: now)!,
                          endDate: cal.date(bySettingHour: 13, minute: 30, second: 0, of: now)!,
                          isAllDay: false, color: .calendarGreen,
                          calendar: "Personal", location: "Campus Cafe", notes: "Bring the notes!", recurrence: nil),
            CalendarEvent(id: UUID(), title: "CS 201 Lab",
                          startDate: cal.date(bySettingHour: 14, minute: 0, second: 0, of: now)!,
                          endDate: cal.date(bySettingHour: 15, minute: 50, second: 0, of: now)!,
                          isAllDay: false, color: .mailBlue,
                          calendar: "School", location: "Tech Lab 2", notes: nil, recurrence: .weekly),
            CalendarEvent(id: UUID(), title: "Gym",
                          startDate: cal.date(bySettingHour: 18, minute: 0, second: 0, of: now)!,
                          endDate: cal.date(bySettingHour: 19, minute: 30, second: 0, of: now)!,
                          isAllDay: false, color: .reminderOrange,
                          calendar: "Health", location: "Campus Rec Center", notes: nil, recurrence: .daily),
            CalendarEvent(id: UUID(), title: "Mom's Birthday",
                          startDate: cal.date(byAdding: .day, value: 2, to: startOfDay)!,
                          endDate: cal.date(byAdding: .day, value: 3, to: startOfDay)!,
                          isAllDay: true, color: Color(red: 1, green: 0.4, blue: 0.7),
                          calendar: "Family", location: nil, notes: "Get a gift!", recurrence: nil),
            CalendarEvent(id: UUID(), title: "CS 201 Midterm",
                          startDate: cal.date(byAdding: .day, value: 2, to: cal.date(bySettingHour: 10, minute: 0, second: 0, of: now)!)!,
                          endDate: cal.date(byAdding: .day, value: 2, to: cal.date(bySettingHour: 12, minute: 0, second: 0, of: now)!)!,
                          isAllDay: false, color: .canvasRed,
                          calendar: "School", location: "Room 204", notes: "Bring pencil + ID", recurrence: nil),
        ]
    }()

    // MARK: - Reminders

    static let reminderLists: [ReminderList] = [
        ReminderList(id: UUID(), name: "School", color: .mailBlue, icon: "graduationcap.fill"),
        ReminderList(id: UUID(), name: "Personal", color: .calendarGreen, icon: "person.fill"),
        ReminderList(id: UUID(), name: "Shopping", color: .reminderOrange, icon: "cart.fill"),
        ReminderList(id: UUID(), name: "Health", color: Color(red: 1, green: 0.4, blue: 0.7), icon: "heart.fill"),
    ]

    static var reminders: [ReminderItem] = {
        let now = Date.now
        let cal = Calendar.current
        let lists = reminderLists
        return [
            ReminderItem(id: UUID(), title: "Review BST lecture notes", notes: "Focus on rotations",
                         dueDate: cal.date(byAdding: .hour, value: 4, to: now),
                         isCompleted: false, priority: .high, list: lists[0], hasReminder: true),
            ReminderItem(id: UUID(), title: "Buy index cards for studying", notes: nil,
                         dueDate: cal.date(byAdding: .day, value: 1, to: now),
                         isCompleted: false, priority: .low, list: lists[2], hasReminder: false),
            ReminderItem(id: UUID(), title: "Email Dr. Kim about office hours", notes: nil,
                         dueDate: now,
                         isCompleted: false, priority: .medium, list: lists[0], hasReminder: true),
            ReminderItem(id: UUID(), title: "Pick up library books", notes: nil,
                         dueDate: cal.date(byAdding: .day, value: 2, to: now),
                         isCompleted: false, priority: .medium, list: lists[1], hasReminder: false),
            ReminderItem(id: UUID(), title: "Haircut appointment", notes: nil,
                         dueDate: cal.date(byAdding: .day, value: 3, to: now),
                         isCompleted: false, priority: .none, list: lists[1], hasReminder: true),
            ReminderItem(id: UUID(), title: "Drink 8 glasses of water", notes: nil,
                         dueDate: nil,
                         isCompleted: true, priority: .none, list: lists[3], hasReminder: false),
            ReminderItem(id: UUID(), title: "Start MATH 152 problem set", notes: "Due Friday",
                         dueDate: cal.date(byAdding: .day, value: -1, to: now),
                         isCompleted: false, priority: .high, list: lists[0], hasReminder: true),
            ReminderItem(id: UUID(), title: "Call Mom – birthday coming up",
                         notes: "Order cake from downtown bakery",
                         dueDate: cal.date(byAdding: .day, value: 1, to: now),
                         isCompleted: false, priority: .high, list: lists[1], hasReminder: true),
        ]
    }()
}

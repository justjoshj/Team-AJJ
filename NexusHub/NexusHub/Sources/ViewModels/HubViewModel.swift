import SwiftUI
import Combine

// MARK: - Canvas ViewModel

class CanvasViewModel: ObservableObject {
    @Published var assignments: [Assignment] = MockDataService.assignments
    @Published var events: [CanvasEvent] = MockDataService.canvasEvents
    @Published var courses: [Course] = MockDataService.courses
    @Published var selectedFilter: Assignment.Status? = nil

    var filteredAssignments: [Assignment] {
        guard let filter = selectedFilter else { return sortedAssignments }
        return sortedAssignments.filter { $0.status == filter }
    }

    var sortedAssignments: [Assignment] {
        assignments.sorted { a, b in
            // Missing/late first, then by due date
            if a.status == .missing && b.status != .missing { return true }
            if b.status == .missing && a.status != .missing { return false }
            return a.dueDate < b.dueDate
        }
    }

    var urgentAssignments: [Assignment] {
        assignments.filter { $0.isUrgent || $0.isOverdue || $0.status == .missing }
    }

    var upcomingEvents: [CanvasEvent] {
        events.filter { $0.startDate > .now }.sorted { $0.startDate < $1.startDate }
    }

    var pendingCount: Int { assignments.filter { $0.status == .upcoming || $0.status == .missing }.count }
}

// MARK: - Mail ViewModel

class MailViewModel: ObservableObject {
    @Published var messages: [MailMessage] = MockDataService.mailMessages
    @Published var selectedCategory: MailMessage.Category? = nil
    @Published var searchText = ""

    var filteredMessages: [MailMessage] {
        var result = messages
        if let cat = selectedCategory { result = result.filter { $0.category == cat } }
        if !searchText.isEmpty {
            result = result.filter {
                $0.subject.localizedCaseInsensitiveContains(searchText) ||
                $0.sender.localizedCaseInsensitiveContains(searchText) ||
                $0.preview.localizedCaseInsensitiveContains(searchText)
            }
        }
        return result.sorted { $0.date > $1.date }
    }

    var unreadCount: Int { messages.filter { !$0.isRead }.count }

    func markRead(_ message: MailMessage) {
        if let idx = messages.firstIndex(where: { $0.id == message.id }) {
            messages[idx].isRead = true
        }
    }

    func toggleStar(_ message: MailMessage) {
        if let idx = messages.firstIndex(where: { $0.id == message.id }) {
            messages[idx].isStarred.toggle()
        }
    }
}

// MARK: - Calendar ViewModel

class CalendarViewModel: ObservableObject {
    @Published var events: [CalendarEvent] = MockDataService.calendarEvents
    @Published var selectedDate: Date = .now

    var todayEvents: [CalendarEvent] {
        events.filter { Calendar.current.isDate($0.startDate, inSameDayAs: selectedDate) }
            .sorted { $0.startDate < $1.startDate }
    }

    var upcomingEvents: [CalendarEvent] {
        events.filter { $0.startDate > .now }.sorted { $0.startDate < $1.startDate }
    }

    var currentEvent: CalendarEvent? {
        events.first { $0.isNow }
    }

    var nextEvent: CalendarEvent? {
        events.filter { $0.startDate > .now }.sorted { $0.startDate < $1.startDate }.first
    }

    func events(for date: Date) -> [CalendarEvent] {
        events.filter { Calendar.current.isDate($0.startDate, inSameDayAs: date) }
    }

    func hasEvents(on date: Date) -> Bool {
        events.contains { Calendar.current.isDate($0.startDate, inSameDayAs: date) }
    }
}

// MARK: - Reminders ViewModel

class RemindersViewModel: ObservableObject {
    @Published var reminders: [ReminderItem] = MockDataService.reminders
    @Published var lists: [ReminderList] = MockDataService.reminderLists
    @Published var selectedList: ReminderList? = nil
    @Published var showCompleted: Bool = false

    var filteredReminders: [ReminderItem] {
        var result = reminders
        if let list = selectedList { result = result.filter { $0.list.id == list.id } }
        if !showCompleted { result = result.filter { !$0.isCompleted } }
        return result.sorted { a, b in
            if a.isOverdue && !b.isOverdue { return true }
            if !a.isOverdue && b.isOverdue { return false }
            if a.priority != b.priority { return a.priority > b.priority }
            guard let da = a.dueDate, let db = b.dueDate else { return a.dueDate != nil }
            return da < db
        }
    }

    var overdueCount: Int { reminders.filter { $0.isOverdue }.count }
    var pendingCount: Int { reminders.filter { !$0.isCompleted }.count }

    func toggle(_ item: ReminderItem) {
        if let idx = reminders.firstIndex(where: { $0.id == item.id }) {
            withAnimation { reminders[idx].isCompleted.toggle() }
        }
    }
}

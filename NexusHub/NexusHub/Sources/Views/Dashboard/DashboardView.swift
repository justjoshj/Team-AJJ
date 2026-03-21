import SwiftUI

struct DashboardView: View {
    @StateObject private var canvasVM = CanvasViewModel()
    @StateObject private var mailVM   = MailViewModel()
    @StateObject private var calVM    = CalendarViewModel()
    @StateObject private var remVM    = RemindersViewModel()
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                // Header
                DashboardHeader()
                    .padding(.horizontal, 20)
                    .padding(.top, 60)
                    .padding(.bottom, 24)

                VStack(spacing: 18) {
                    // Quick stats row
                    QuickStatsRow(
                        canvas: canvasVM.pendingCount,
                        mail: mailVM.unreadCount,
                        calendar: calVM.upcomingEvents.count,
                        reminders: remVM.pendingCount
                    )
                    .padding(.horizontal, 20)

                    // Upcoming now
                    if let next = calVM.nextEvent {
                        UpNextCard(event: next)
                            .padding(.horizontal, 20)
                    }

                    // Urgent assignments
                    if !canvasVM.urgentAssignments.isEmpty {
                        UrgentAssignmentsSection(assignments: canvasVM.urgentAssignments)
                            .padding(.horizontal, 20)
                    }

                    // Today's schedule
                    TodayScheduleSection(events: calVM.todayEvents)
                        .padding(.horizontal, 20)

                    // Recent mail
                    RecentMailSection(messages: Array(mailVM.filteredMessages.prefix(3)))
                        .padding(.horizontal, 20)

                    // Reminders due today
                    DueSoonRemindersSection(reminders: remVM.filteredReminders)
                        .padding(.horizontal, 20)
                }

                Spacer(minLength: 120)
            }
        }
        .ignoresSafeArea(edges: .top)
    }
}

// MARK: - Header

struct DashboardHeader: View {
    private var greeting: String {
        let h = Calendar.current.component(.hour, from: .now)
        switch h {
        case 0..<12:  return "Good morning"
        case 12..<17: return "Good afternoon"
        default:      return "Good evening"
        }
    }

    private var dateString: String {
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMMM d"
        return f.string(from: .now)
    }

    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text(greeting)
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                Text(dateString)
                    .font(.system(size: 15, weight: .regular))
                    .foregroundStyle(.white.opacity(0.5))
            }
            Spacer()
            // Profile avatar
            ZStack {
                Circle()
                    .fill(.ultraThinMaterial)
                    .overlay(Circle().stroke(Color.borderSubtle, lineWidth: 0.5))
                    .frame(width: 46, height: 46)
                Text("JD")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.white)
            }
        }
    }
}

// MARK: - Quick Stats Row

struct QuickStatsRow: View {
    let canvas: Int
    let mail: Int
    let calendar: Int
    let reminders: Int

    @EnvironmentObject private var appState: AppState

    var body: some View {
        HStack(spacing: 10) {
            QuickStatChip(value: canvas,    label: "Due",      color: .canvasRed,      tab: .canvas)
            QuickStatChip(value: mail,      label: "Unread",   color: .mailBlue,       tab: .mail)
            QuickStatChip(value: calendar,  label: "Events",   color: .calendarGreen,  tab: .calendar)
            QuickStatChip(value: reminders, label: "Tasks",    color: .reminderOrange, tab: .reminders)
        }
    }
}

struct QuickStatChip: View {
    let value: Int
    let label: String
    let color: Color
    let tab: AppState.Tab
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                appState.selectedTab = tab
            }
        } label: {
            VStack(spacing: 4) {
                Text("\(value)")
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(color)
                Text(label)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(.white.opacity(0.5))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(color.opacity(0.10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(color.opacity(0.20), lineWidth: 0.5)
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Up Next Card

struct UpNextCard: View {
    let event: CalendarEvent

    private var timeUntil: String {
        let mins = Int(event.startDate.timeIntervalSince(.now) / 60)
        if mins < 60 { return "In \(mins) min" }
        return "In \(mins / 60)h \(mins % 60)m"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("UP NEXT", systemImage: "clock.fill")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(event.color)
                Spacer()
                Text(timeUntil)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.5))
            }

            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(event.color)
                    .frame(width: 4, height: 40)

                VStack(alignment: .leading, spacing: 4) {
                    Text(event.title)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                    if let loc = event.location {
                        Label(loc, systemImage: "mappin.circle")
                            .font(.system(size: 12))
                            .foregroundStyle(.white.opacity(0.5))
                    }
                }
            }
        }
        .glassCard()
    }
}

// MARK: - Urgent Assignments Section

struct UrgentAssignmentsSection: View {
    let assignments: [Assignment]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Action Needed",
                          subtitle: "\(assignments.count) item\(assignments.count == 1 ? "" : "s") need attention")

            VStack(spacing: 8) {
                ForEach(assignments.prefix(3)) { assignment in
                    UrgentAssignmentRow(assignment: assignment)
                }
            }
        }
    }
}

struct UrgentAssignmentRow: View {
    let assignment: Assignment

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 3)
                .fill(assignment.courseColor)
                .frame(width: 3)

            VStack(alignment: .leading, spacing: 3) {
                Text(assignment.title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                Text(assignment.course)
                    .font(.system(size: 12))
                    .foregroundStyle(.white.opacity(0.5))
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 3) {
                StatusBadge(text: assignment.status.rawValue, color: assignment.status.color)
                RelativeDateLabel(date: assignment.dueDate)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(assignment.status == .missing
                      ? Color.red.opacity(0.08)
                      : Color.surfacePrimary)
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Color.borderSubtle, lineWidth: 0.5)
                )
        )
    }
}

// MARK: - Today's Schedule

struct TodayScheduleSection: View {
    let events: [CalendarEvent]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Today", subtitle: "\(events.count) event\(events.count == 1 ? "" : "s")")

            if events.isEmpty {
                HStack {
                    Spacer()
                    Text("Nothing scheduled today")
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.35))
                    Spacer()
                }
                .padding(.vertical, 20)
                .glassCard(padding: 0)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(events.enumerated()), id: \.element.id) { idx, event in
                        DashboardEventRow(event: event)
                        if idx < events.count - 1 {
                            Divider().background(Color.borderSubtle).padding(.leading, 56)
                        }
                    }
                }
                .glassCard(padding: 0)
            }
        }
    }
}

struct DashboardEventRow: View {
    let event: CalendarEvent

    private var timeString: String {
        if event.isAllDay { return "All Day" }
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        return f.string(from: event.startDate)
    }

    var body: some View {
        HStack(spacing: 12) {
            Text(timeString)
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundStyle(.white.opacity(0.45))
                .frame(width: 52, alignment: .trailing)

            Circle()
                .fill(event.color)
                .frame(width: 8, height: 8)

            Text(event.title)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.white)
                .lineLimit(1)

            Spacer()

            if event.isNow {
                StatusBadge(text: "Now", color: .green)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}

// MARK: - Recent Mail Section

struct RecentMailSection: View {
    let messages: [MailMessage]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Recent Mail",
                          subtitle: "\(messages.filter { !$0.isRead }.count) unread")

            VStack(spacing: 8) {
                ForEach(messages) { msg in
                    DashboardMailRow(message: msg)
                }
            }
        }
    }
}

struct DashboardMailRow: View {
    let message: MailMessage

    var body: some View {
        HStack(spacing: 12) {
            AvatarCircle(text: message.senderInitials, color: message.senderColor, size: 38)

            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(message.sender)
                        .font(.system(size: 13, weight: message.isRead ? .regular : .semibold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    Spacer()
                    Text(message.timeAgo)
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.4))
                }
                Text(message.subject)
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.7))
                    .lineLimit(1)
            }

            if !message.isRead {
                Circle().fill(Color.mailBlue).frame(width: 7, height: 7)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.surfacePrimary)
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Color.borderSubtle, lineWidth: 0.5)
                )
        )
    }
}

// MARK: - Reminders Due Soon

struct DueSoonRemindersSection: View {
    let reminders: [ReminderItem]

    private var dueSoon: [ReminderItem] {
        reminders.filter { item in
            guard let due = item.dueDate else { return false }
            return due <= Date.now.addingTimeInterval(86400) && !item.isCompleted
        }.prefix(4).map { $0 }
    }

    var body: some View {
        if !dueSoon.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "Due Soon", subtitle: "Next 24 hours")

                VStack(spacing: 8) {
                    ForEach(dueSoon) { item in
                        DashboardReminderRow(item: item)
                    }
                }
            }
        }
    }
}

struct DashboardReminderRow: View {
    let item: ReminderItem

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 20))
                .foregroundStyle(item.isCompleted ? .green : item.list.color)

            VStack(alignment: .leading, spacing: 2) {
                Text(item.title)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(item.isCompleted ? .white.opacity(0.4) : .white)
                    .strikethrough(item.isCompleted)
                    .lineLimit(1)
                Text(item.list.name)
                    .font(.system(size: 11))
                    .foregroundStyle(.white.opacity(0.4))
            }

            Spacer()

            if item.priority != .none {
                Image(systemName: "flag.fill")
                    .font(.system(size: 11))
                    .foregroundStyle(item.priority.color)
            }

            if let due = item.dueDate {
                RelativeDateLabel(date: due, showTime: true)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(item.isOverdue ? Color.red.opacity(0.08) : Color.surfacePrimary)
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Color.borderSubtle, lineWidth: 0.5)
                )
        )
    }
}

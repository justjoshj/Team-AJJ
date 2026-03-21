import SwiftUI

struct CalendarView: View {
    @StateObject private var vm = CalendarViewModel()

    var body: some View {
        VStack(spacing: 0) {
            CalendarHeader(vm: vm)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {
                    // Mini month grid
                    MonthGridView(vm: vm)
                        .padding(.horizontal, 20)

                    // Events for selected day
                    DayEventsSection(vm: vm)
                        .padding(.horizontal, 20)

                    // Upcoming section
                    UpcomingEventsSection(vm: vm)
                        .padding(.horizontal, 20)

                    Spacer(minLength: 120)
                }
                .padding(.top, 14)
            }
        }
        .ignoresSafeArea(edges: .top)
    }
}

// MARK: - Header

struct CalendarHeader: View {
    @ObservedObject var vm: CalendarViewModel

    private var monthYear: String {
        let f = DateFormatter()
        f.dateFormat = "MMMM yyyy"
        return f.string(from: vm.selectedDate)
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 8) {
                        Image(systemName: "calendar")
                            .foregroundStyle(Color.calendarGreen)
                        Text("Calendar")
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                    }
                    Text(monthYear)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.5))
                }
                Spacer()

                HStack(spacing: 8) {
                    Button {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                            vm.selectedDate = Calendar.current.date(byAdding: .month, value: -1, to: vm.selectedDate) ?? vm.selectedDate
                        }
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.6))
                            .frame(width: 34, height: 34)
                            .background(.ultraThinMaterial, in: Circle())
                    }

                    Button {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                            vm.selectedDate = Calendar.current.date(byAdding: .month, value: 1, to: vm.selectedDate) ?? vm.selectedDate
                        }
                    } label: {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.6))
                            .frame(width: 34, height: 34)
                            .background(.ultraThinMaterial, in: Circle())
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 60)
            .padding(.bottom, 16)
        }
        .background(
            LinearGradient(colors: [Color.black.opacity(0.7), .clear], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
        )
    }
}

// MARK: - Month Grid

struct MonthGridView: View {
    @ObservedObject var vm: CalendarViewModel
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 7)
    private let dayLabels = ["S","M","T","W","T","F","S"]

    private var monthDays: [Date?] {
        let cal = Calendar.current
        guard let range = cal.range(of: .day, in: .month, for: vm.selectedDate),
              let firstDay = cal.date(from: cal.dateComponents([.year, .month], from: vm.selectedDate))
        else { return [] }

        let weekday = cal.component(.weekday, from: firstDay) - 1
        var days: [Date?] = Array(repeating: nil, count: weekday)
        for day in range {
            if let d = cal.date(byAdding: .day, value: day - 1, to: firstDay) {
                days.append(d)
            }
        }
        return days
    }

    var body: some View {
        VStack(spacing: 10) {
            // Day headers
            HStack(spacing: 4) {
                ForEach(dayLabels, id: \.self) { label in
                    Text(label)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.4))
                        .frame(maxWidth: .infinity)
                }
            }

            // Day cells
            LazyVGrid(columns: columns, spacing: 6) {
                ForEach(Array(monthDays.enumerated()), id: \.offset) { _, date in
                    if let date = date {
                        DayCell(date: date, vm: vm)
                    } else {
                        Color.clear.frame(height: 36)
                    }
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(Color.borderSubtle, lineWidth: 0.5)
                )
        )
    }
}

struct DayCell: View {
    let date: Date
    @ObservedObject var vm: CalendarViewModel

    private var isToday: Bool { Calendar.current.isDateInToday(date) }
    private var isSelected: Bool { Calendar.current.isDate(date, inSameDayAs: vm.selectedDate) }
    private var hasEvents: Bool { vm.hasEvents(on: date) }

    private var dayNumber: String {
        let f = DateFormatter()
        f.dateFormat = "d"
        return f.string(from: date)
    }

    var body: some View {
        Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                vm.selectedDate = date
            }
        } label: {
            ZStack {
                Circle()
                    .fill(
                        isSelected
                            ? Color.calendarGreen
                            : isToday
                                ? Color.calendarGreen.opacity(0.2)
                                : Color.clear
                    )
                    .frame(width: 34, height: 34)

                Text(dayNumber)
                    .font(.system(size: 13, weight: isToday || isSelected ? .bold : .regular))
                    .foregroundStyle(
                        isSelected
                            ? .black
                            : isToday
                                ? Color.calendarGreen
                                : .white.opacity(0.75)
                    )
            }
            .frame(maxWidth: .infinity)
            .overlay(alignment: .bottom) {
                if hasEvents && !isSelected {
                    HStack(spacing: 2) {
                        ForEach(vm.events(for: date).prefix(3)) { event in
                            Circle()
                                .fill(event.color)
                                .frame(width: 4, height: 4)
                        }
                    }
                    .offset(y: 6)
                }
            }
        }
        .buttonStyle(.plain)
        .frame(height: 40)
    }
}

// MARK: - Day Events Section

struct DayEventsSection: View {
    @ObservedObject var vm: CalendarViewModel

    private var title: String {
        if Calendar.current.isDateInToday(vm.selectedDate) { return "Today" }
        if Calendar.current.isDateInTomorrow(vm.selectedDate) { return "Tomorrow" }
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMM d"
        return f.string(from: vm.selectedDate)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: title, subtitle: "\(vm.todayEvents.count) event\(vm.todayEvents.count == 1 ? "" : "s")")

            if vm.todayEvents.isEmpty {
                EmptyStateView(
                    icon: "calendar.badge.checkmark",
                    title: "Free day",
                    message: "No events scheduled.",
                    color: .calendarGreen
                )
                .glassCard(padding: 0)
            } else {
                VStack(spacing: 10) {
                    ForEach(vm.todayEvents) { event in
                        CalendarEventCard(event: event)
                    }
                }
            }
        }
    }
}

struct CalendarEventCard: View {
    let event: CalendarEvent

    private var timeRange: String {
        if event.isAllDay { return "All Day" }
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        let start = f.string(from: event.startDate)
        let end = f.string(from: event.endDate ?? event.startDate)
        return "\(start) – \(end)"
    }

    private var duration: String {
        guard !event.isAllDay, let end = event.endDate else { return "" }
        let mins = Int(end.timeIntervalSince(event.startDate) / 60)
        if mins < 60 { return "\(mins)m" }
        let h = mins / 60; let m = mins % 60
        return m == 0 ? "\(h)h" : "\(h)h \(m)m"
    }

    var body: some View {
        HStack(spacing: 14) {
            RoundedRectangle(cornerRadius: 4)
                .fill(event.color)
                .frame(width: 4)
                .frame(minHeight: 54)

            VStack(alignment: .leading, spacing: 5) {
                Text(event.title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.white)

                HStack(spacing: 12) {
                    Label(timeRange, systemImage: "clock")
                    if !duration.isEmpty {
                        Text("·")
                        Text(duration)
                    }
                }
                .font(.system(size: 12))
                .foregroundStyle(.white.opacity(0.5))

                if let loc = event.location {
                    Label(loc, systemImage: "mappin.circle")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.5))
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 6) {
                if event.isNow {
                    StatusBadge(text: "Now", color: .green)
                }
                if let rec = event.recurrence {
                    Image(systemName: rec.icon)
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.35))
                }
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(event.color.opacity(0.07))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(event.color.opacity(0.2), lineWidth: 0.5)
                )
        )
    }
}

// MARK: - Upcoming Events Section

struct UpcomingEventsSection: View {
    @ObservedObject var vm: CalendarViewModel

    // Group upcoming events by date
    private var grouped: [(String, [CalendarEvent])] {
        let upcoming = vm.upcomingEvents.filter {
            !Calendar.current.isDate($0.startDate, inSameDayAs: vm.selectedDate)
        }.prefix(10)

        var dict: [String: [CalendarEvent]] = [:]
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMM d"

        for event in upcoming {
            let key: String
            if Calendar.current.isDateInToday(event.startDate) { key = "Today" }
            else if Calendar.current.isDateInTomorrow(event.startDate) { key = "Tomorrow" }
            else { key = f.string(from: event.startDate) }

            dict[key, default: []].append(event)
        }

        return dict.sorted { a, b in
            let firstA = dict[a.key]?.first?.startDate ?? .distantFuture
            let firstB = dict[b.key]?.first?.startDate ?? .distantFuture
            return firstA < firstB
        }
    }

    var body: some View {
        if !grouped.isEmpty {
            VStack(alignment: .leading, spacing: 16) {
                SectionHeader(title: "Upcoming")

                ForEach(grouped, id: \.0) { dateLabel, events in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(dateLabel)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.4))
                            .textCase(.uppercase)

                        ForEach(events) { event in
                            UpcomingEventRow(event: event)
                        }
                    }
                }
            }
        }
    }
}

struct UpcomingEventRow: View {
    let event: CalendarEvent

    private var timeStr: String {
        if event.isAllDay { return "All Day" }
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        return f.string(from: event.startDate)
    }

    var body: some View {
        HStack(spacing: 12) {
            Text(timeStr)
                .font(.system(size: 12, weight: .medium, design: .monospaced))
                .foregroundStyle(.white.opacity(0.4))
                .frame(width: 62, alignment: .trailing)

            Circle().fill(event.color).frame(width: 8, height: 8)

            Text(event.title)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.white)
                .lineLimit(1)

            Spacer()

            Text(event.calendar)
                .font(.system(size: 11))
                .foregroundStyle(.white.opacity(0.35))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(
            RoundedRectangle(cornerRadius: 13, style: .continuous)
                .fill(Color.surfacePrimary)
                .overlay(RoundedRectangle(cornerRadius: 13).stroke(Color.borderSubtle, lineWidth: 0.5))
        )
    }
}

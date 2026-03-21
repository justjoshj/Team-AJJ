import SwiftUI

struct RemindersView: View {
    @StateObject private var vm = RemindersViewModel()
    @State private var showAddSheet = false

    var body: some View {
        VStack(spacing: 0) {
            RemindersHeader(vm: vm, showAddSheet: $showAddSheet)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {
                    // List chips
                    ListsRow(vm: vm)
                        .padding(.horizontal, 20)

                    // Stats row
                    RemindersStatsRow(vm: vm)
                        .padding(.horizontal, 20)

                    // Reminder items
                    ReminderItemsList(vm: vm)
                        .padding(.horizontal, 20)

                    Spacer(minLength: 120)
                }
                .padding(.top, 12)
            }
        }
        .ignoresSafeArea(edges: .top)
        .sheet(isPresented: $showAddSheet) {
            AddReminderSheet(vm: vm)
        }
    }
}

// MARK: - Header

struct RemindersHeader: View {
    @ObservedObject var vm: RemindersViewModel
    @Binding var showAddSheet: Bool

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(Color.reminderOrange)
                        Text("Reminders")
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                    }
                    Text("\(vm.pendingCount) pending · \(vm.overdueCount) overdue")
                        .font(.caption)
                        .foregroundStyle(vm.overdueCount > 0 ? .red.opacity(0.8) : .white.opacity(0.5))
                }
                Spacer()

                Button { showAddSheet = true } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Color.reminderOrange)
                        .frame(width: 38, height: 38)
                        .background(Color.reminderOrange.opacity(0.15), in: Circle())
                        .overlay(Circle().stroke(Color.reminderOrange.opacity(0.3), lineWidth: 0.5))
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 60)
            .padding(.bottom, 14)

            // Toggle completed
            HStack {
                Spacer()
                Button {
                    withAnimation { vm.showCompleted.toggle() }
                } label: {
                    Label(vm.showCompleted ? "Hide Completed" : "Show Completed",
                          systemImage: vm.showCompleted ? "eye.slash" : "eye")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.white.opacity(0.45))
                }
                .padding(.trailing, 20)
            }
            .padding(.bottom, 6)
        }
        .background(
            LinearGradient(colors: [Color.black.opacity(0.7), .clear], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
        )
    }
}

// MARK: - Lists Row

struct ListsRow: View {
    @ObservedObject var vm: RemindersViewModel

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                // All chip
                Button {
                    withAnimation { vm.selectedList = nil }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "tray.fill")
                            .font(.system(size: 12))
                        Text("All")
                            .font(.system(size: 13, weight: vm.selectedList == nil ? .semibold : .regular))
                    }
                    .foregroundStyle(vm.selectedList == nil ? .white : .white.opacity(0.5))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(vm.selectedList == nil ? Color.white.opacity(0.12) : Color.surfacePrimary,
                                in: Capsule())
                    .overlay(Capsule().stroke(vm.selectedList == nil ? Color.white.opacity(0.3) : Color.borderSubtle, lineWidth: 0.5))
                }
                .buttonStyle(.plain)

                ForEach(vm.lists) { list in
                    ListChip(list: list, isSelected: vm.selectedList?.id == list.id) {
                        withAnimation { vm.selectedList = vm.selectedList?.id == list.id ? nil : list }
                    }
                }
            }
        }
    }
}

struct ListChip: View {
    let list: ReminderList
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: list.icon)
                    .font(.system(size: 11))
                Text(list.name)
                    .font(.system(size: 13, weight: isSelected ? .semibold : .regular))
            }
            .foregroundStyle(isSelected ? list.color : .white.opacity(0.5))
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(isSelected ? list.color.opacity(0.15) : Color.surfacePrimary, in: Capsule())
            .overlay(Capsule().stroke(isSelected ? list.color.opacity(0.4) : Color.borderSubtle, lineWidth: 0.5))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Stats Row

struct RemindersStatsRow: View {
    @ObservedObject var vm: RemindersViewModel

    var body: some View {
        HStack(spacing: 10) {
            ReminderStatCard(value: vm.overdueCount, label: "Overdue", color: .red)
            ReminderStatCard(value: vm.pendingCount, label: "Pending", color: .reminderOrange)
            ReminderStatCard(
                value: vm.reminders.filter { $0.isCompleted }.count,
                label: "Done", color: .calendarGreen
            )
        }
    }
}

struct ReminderStatCard: View {
    let value: Int
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text("\(value)")
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(color)
            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(.white.opacity(0.45))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(color.opacity(0.10), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(color.opacity(0.2), lineWidth: 0.5))
    }
}

// MARK: - Reminder Items List

struct ReminderItemsList: View {
    @ObservedObject var vm: RemindersViewModel

    // Group by section
    private var overdue: [ReminderItem] { vm.filteredReminders.filter { $0.isOverdue } }
    private var today: [ReminderItem] {
        vm.filteredReminders.filter { item in
            !item.isOverdue && !item.isCompleted &&
            item.dueDate.map { Calendar.current.isDateInToday($0) } ?? false
        }
    }
    private var upcoming: [ReminderItem] {
        vm.filteredReminders.filter { item in
            !item.isOverdue && !item.isCompleted &&
            !(item.dueDate.map { Calendar.current.isDateInToday($0) } ?? false)
        }
    }
    private var completed: [ReminderItem] { vm.filteredReminders.filter { $0.isCompleted } }

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            if !overdue.isEmpty {
                ReminderSection(title: "Overdue", color: .red, items: overdue, vm: vm)
            }
            if !today.isEmpty {
                ReminderSection(title: "Today", color: .reminderOrange, items: today, vm: vm)
            }
            if !upcoming.isEmpty {
                ReminderSection(title: "Upcoming", color: .white, items: upcoming, vm: vm)
            }
            if vm.showCompleted && !completed.isEmpty {
                ReminderSection(title: "Completed", color: .calendarGreen, items: completed, vm: vm)
            }

            if vm.filteredReminders.filter({ !$0.isCompleted }).isEmpty {
                EmptyStateView(
                    icon: "checkmark.seal.fill",
                    title: "All caught up!",
                    message: "No pending reminders.",
                    color: .reminderOrange
                )
            }
        }
    }
}

struct ReminderSection: View {
    let title: String
    let color: Color
    let items: [ReminderItem]
    @ObservedObject var vm: RemindersViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(color)
                    .frame(width: 3, height: 14)
                Text(title)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(color.opacity(0.85))
                    .textCase(.uppercase)
                Text("(\(items.count))")
                    .font(.system(size: 11))
                    .foregroundStyle(.white.opacity(0.3))
            }

            VStack(spacing: 6) {
                ForEach(items) { item in
                    ReminderRow(item: item, vm: vm)
                }
            }
        }
    }
}

struct ReminderRow: View {
    let item: ReminderItem
    @ObservedObject var vm: RemindersViewModel
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 12) {
                // Checkbox
                Button { vm.toggle(item) } label: {
                    ZStack {
                        Circle()
                            .stroke(item.isCompleted ? item.list.color : Color.white.opacity(0.3), lineWidth: 1.5)
                            .frame(width: 22, height: 22)
                        if item.isCompleted {
                            Image(systemName: "checkmark")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(item.list.color)
                        }
                    }
                }
                .buttonStyle(.plain)

                // Content
                VStack(alignment: .leading, spacing: 3) {
                    Text(item.title)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(item.isCompleted ? .white.opacity(0.38) : .white)
                        .strikethrough(item.isCompleted, color: .white.opacity(0.3))
                        .lineLimit(isExpanded ? nil : 1)

                    HStack(spacing: 8) {
                        // List tag
                        HStack(spacing: 4) {
                            Image(systemName: item.list.icon).font(.system(size: 9))
                            Text(item.list.name).font(.system(size: 10))
                        }
                        .foregroundStyle(item.list.color.opacity(0.8))

                        // Due date
                        if let due = item.dueDate {
                            HStack(spacing: 3) {
                                Image(systemName: "calendar").font(.system(size: 9))
                                RelativeDateLabel(date: due, showTime: true)
                            }
                            .foregroundStyle(item.isOverdue ? .red.opacity(0.8) : .white.opacity(0.4))
                        }

                        if item.hasReminder {
                            Image(systemName: "bell.fill")
                                .font(.system(size: 9))
                                .foregroundStyle(.white.opacity(0.3))
                        }
                    }
                }

                Spacer()

                // Priority flag
                if item.priority != .none {
                    Image(systemName: "flag.fill")
                        .font(.system(size: 13))
                        .foregroundStyle(item.priority.color)
                }

                // Expand arrow
                if item.notes != nil {
                    Button { withAnimation(.spring(response: 0.3)) { isExpanded.toggle() } } label: {
                        Image(systemName: "chevron.down")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.3))
                            .rotationEffect(.degrees(isExpanded ? 180 : 0))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)

            // Expanded notes
            if isExpanded, let notes = item.notes {
                Text(notes)
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.55))
                    .padding(.horizontal, 48)
                    .padding(.bottom, 12)
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(item.isOverdue && !item.isCompleted ? Color.red.opacity(0.07) : Color.surfacePrimary)
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(
                            item.isOverdue && !item.isCompleted
                                ? Color.red.opacity(0.25)
                                : Color.borderSubtle,
                            lineWidth: 0.5
                        )
                )
        )
    }
}

// MARK: - Add Reminder Sheet

struct AddReminderSheet: View {
    @ObservedObject var vm: RemindersViewModel
    @Environment(\.dismiss) var dismiss

    @State private var title = ""
    @State private var notes = ""
    @State private var hasDueDate = false
    @State private var dueDate = Date.now.addingTimeInterval(3600)
    @State private var priority: ReminderItem.Priority = .none
    @State private var selectedList: ReminderList?

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            MeshBackgroundView().ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Title
                    Text("New Reminder")
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)

                    // Title field
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Title", systemImage: "text.cursor")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.5))
                        TextField("Reminder title...", text: $title, axis: .vertical)
                            .font(.system(size: 16))
                            .foregroundStyle(.white)
                            .tint(.reminderOrange)
                    }
                    .glassCard()

                    // Notes field
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Notes", systemImage: "note.text")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.5))
                        TextField("Optional notes...", text: $notes, axis: .vertical)
                            .font(.system(size: 15))
                            .foregroundStyle(.white)
                            .tint(.reminderOrange)
                            .lineLimit(3...6)
                    }
                    .glassCard()

                    // Due date
                    VStack(alignment: .leading, spacing: 12) {
                        Toggle(isOn: $hasDueDate) {
                            Label("Due Date", systemImage: "calendar")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.white)
                        }
                        .tint(.reminderOrange)

                        if hasDueDate {
                            DatePicker("", selection: $dueDate, displayedComponents: [.date, .hourAndMinute])
                                .datePickerStyle(.graphical)
                                .colorScheme(.dark)
                                .tint(.reminderOrange)
                        }
                    }
                    .glassCard()

                    // Priority
                    VStack(alignment: .leading, spacing: 10) {
                        Label("Priority", systemImage: "flag.fill")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.5))
                        HStack(spacing: 10) {
                            ForEach(ReminderItem.Priority.allCases, id: \.self) { p in
                                PriorityButton(priority: p, isSelected: priority == p) {
                                    priority = p
                                }
                            }
                        }
                    }
                    .glassCard()

                    // List picker
                    VStack(alignment: .leading, spacing: 10) {
                        Label("List", systemImage: "tray.2.fill")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.5))
                        HStack(spacing: 8) {
                            ForEach(vm.lists) { list in
                                ListChip(list: list, isSelected: selectedList?.id == list.id) {
                                    selectedList = list
                                }
                            }
                        }
                    }
                    .glassCard()

                    // Save button
                    Button {
                        guard !title.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                        let list = selectedList ?? vm.lists.first!
                        let item = ReminderItem(
                            id: UUID(), title: title,
                            notes: notes.isEmpty ? nil : notes,
                            dueDate: hasDueDate ? dueDate : nil,
                            isCompleted: false, priority: priority,
                            list: list, hasReminder: hasDueDate
                        )
                        withAnimation { vm.reminders.append(item) }
                        dismiss()
                    } label: {
                        Text("Add Reminder")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.reminderOrange, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                    .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                    .opacity(title.trimmingCharacters(in: .whitespaces).isEmpty ? 0.4 : 1)
                    .buttonStyle(.plain)

                    Spacer(minLength: 40)
                }
                .padding(24)
            }
        }
        .overlay(alignment: .topTrailing) {
            Button { dismiss() } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 28))
                    .foregroundStyle(.white.opacity(0.45))
            }
            .padding(20)
        }
    }
}

struct PriorityButton: View {
    let priority: ReminderItem.Priority
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 5) {
                if priority != .none {
                    Image(systemName: "flag.fill")
                        .font(.system(size: 11))
                        .foregroundStyle(priority.color)
                }
                Text(priority == .none ? "None" : priority.label)
                    .font(.system(size: 12, weight: isSelected ? .semibold : .regular))
                    .foregroundStyle(isSelected ? priority == .none ? .white : priority.color : .white.opacity(0.45))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                isSelected
                    ? (priority == .none ? Color.white.opacity(0.12) : priority.color.opacity(0.15))
                    : Color.surfacePrimary,
                in: Capsule()
            )
            .overlay(
                Capsule().stroke(
                    isSelected
                        ? (priority == .none ? Color.white.opacity(0.3) : priority.color.opacity(0.4))
                        : Color.borderSubtle,
                    lineWidth: 0.5
                )
            )
        }
        .buttonStyle(.plain)
    }
}

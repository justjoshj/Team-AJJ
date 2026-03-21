import SwiftUI

struct CanvasView: View {
    @StateObject private var vm = CanvasViewModel()
    @State private var selectedSegment = 0

    var body: some View {
        VStack(spacing: 0) {
            // Header
            CanvasHeader(vm: vm, selectedSegment: $selectedSegment)

            // Content
            if selectedSegment == 0 {
                AssignmentsList(vm: vm)
            } else {
                CanvasEventsList(vm: vm)
            }
        }
        .ignoresSafeArea(edges: .top)
    }
}

// MARK: - Header

struct CanvasHeader: View {
    @ObservedObject var vm: CanvasViewModel
    @Binding var selectedSegment: Int

    var body: some View {
        VStack(spacing: 0) {
            // Title bar
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 8) {
                        Image(systemName: "book.pages.fill")
                            .foregroundStyle(Color.canvasRed)
                        Text("Canvas")
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                    }
                    Text("\(vm.pendingCount) pending")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.5))
                }
                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.top, 60)
            .padding(.bottom, 16)

            // Courses scroll
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(vm.courses) { course in
                        CourseChip(course: course)
                    }
                }
                .padding(.horizontal, 20)
            }
            .padding(.bottom, 14)

            // Segment control
            HStack(spacing: 0) {
                SegmentButton(title: "Assignments", count: vm.assignments.count,
                              isSelected: selectedSegment == 0,
                              color: .canvasRed) { selectedSegment = 0 }
                SegmentButton(title: "Events", count: vm.events.count,
                              isSelected: selectedSegment == 1,
                              color: .canvasRed) { selectedSegment = 1 }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 4)

            // Filter chips (assignments only)
            if selectedSegment == 0 {
                AssignmentFilterChips(vm: vm)
                    .padding(.bottom, 10)
            }
        }
        .background(
            LinearGradient(
                colors: [Color.black.opacity(0.7), .clear],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()
        )
    }
}

struct CourseChip: View {
    let course: Course

    var body: some View {
        HStack(spacing: 6) {
            Circle().fill(course.color).frame(width: 8, height: 8)
            Text(course.code)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(course.color.opacity(0.15), in: Capsule())
        .overlay(Capsule().stroke(course.color.opacity(0.3), lineWidth: 0.5))
    }
}

struct SegmentButton: View {
    let title: String
    let count: Int
    let isSelected: Bool
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Text(title)
                    .font(.system(size: 14, weight: isSelected ? .semibold : .regular))
                Text("\(count)")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(isSelected ? color : .white.opacity(0.3))
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(isSelected ? color.opacity(0.2) : Color.clear, in: Capsule())
            }
            .foregroundStyle(isSelected ? .white : .white.opacity(0.4))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .overlay(alignment: .bottom) {
                if isSelected {
                    Rectangle()
                        .fill(color)
                        .frame(height: 2)
                        .clipShape(Capsule())
                }
            }
        }
        .buttonStyle(.plain)
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: isSelected)
    }
}

struct AssignmentFilterChips: View {
    @ObservedObject var vm: CanvasViewModel

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(title: "All", isSelected: vm.selectedFilter == nil, color: .white) {
                    vm.selectedFilter = nil
                }
                ForEach(Assignment.Status.allCases, id: \.self) { status in
                    FilterChip(title: status.rawValue, isSelected: vm.selectedFilter == status,
                                color: status.color) {
                        vm.selectedFilter = vm.selectedFilter == status ? nil : status
                    }
                }
            }
            .padding(.horizontal, 20)
        }
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 12, weight: isSelected ? .semibold : .regular))
                .foregroundStyle(isSelected ? color : .white.opacity(0.5))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    isSelected ? color.opacity(0.15) : Color.surfacePrimary,
                    in: Capsule()
                )
                .overlay(Capsule().stroke(isSelected ? color.opacity(0.4) : Color.borderSubtle, lineWidth: 0.5))
        }
        .buttonStyle(.plain)
        .animation(.easeInOut(duration: 0.15), value: isSelected)
    }
}

// MARK: - Assignments List

struct AssignmentsList: View {
    @ObservedObject var vm: CanvasViewModel
    @State private var selectedAssignment: Assignment? = nil

    var body: some View {
        ScrollView(showsIndicators: false) {
            LazyVStack(spacing: 10) {
                ForEach(vm.filteredAssignments) { assignment in
                    AssignmentCard(assignment: assignment)
                        .onTapGesture {
                            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                                selectedAssignment = assignment
                            }
                        }
                }
                Spacer(minLength: 120)
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
        }
        .sheet(item: $selectedAssignment) { assignment in
            AssignmentDetailSheet(assignment: assignment)
        }
    }
}

struct AssignmentCard: View {
    let assignment: Assignment

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Circle().fill(assignment.courseColor).frame(width: 8, height: 8)
                        Text(assignment.course)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(assignment.courseColor)
                    }
                    Text(assignment.title)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                }
                Spacer()
                Image(systemName: assignment.status.icon)
                    .font(.system(size: 18))
                    .foregroundStyle(assignment.status.color)
            }

            HStack {
                Label("\(assignment.points) pts", systemImage: "star.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(.white.opacity(0.5))

                Spacer()

                StatusBadge(text: assignment.status.rawValue, color: assignment.status.color)

                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.system(size: 11))
                    RelativeDateLabel(date: assignment.dueDate)
                }
                .foregroundStyle(assignment.isUrgent ? .orange : .white.opacity(0.5))
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(assignment.status == .missing
                      ? Color.red.opacity(0.08)
                      : Color.surfacePrimary)
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(
                            assignment.isUrgent
                                ? Color.orange.opacity(0.4)
                                : Color.borderSubtle,
                            lineWidth: 0.6
                        )
                )
        )
    }
}

struct AssignmentDetailSheet: View {
    let assignment: Assignment
    @Environment(\.dismiss) var dismiss

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            MeshBackgroundView().ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 6) {
                            Circle().fill(assignment.courseColor).frame(width: 10, height: 10)
                            Text(assignment.course)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(assignment.courseColor)
                        }
                        Text(assignment.title)
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                    }

                    // Meta info
                    HStack(spacing: 16) {
                        InfoPill(icon: "star.fill", text: "\(assignment.points) points", color: .yellow)
                        InfoPill(icon: assignment.status.icon, text: assignment.status.rawValue,
                                 color: assignment.status.color)
                    }

                    // Due date
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Due Date", systemImage: "calendar")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.6))
                        Text(assignment.dueDate, style: .date)
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(.white)
                        Text(assignment.dueDate, style: .time)
                            .font(.system(size: 14))
                            .foregroundStyle(.white.opacity(0.5))
                    }
                    .glassCard()

                    // Description
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Description", systemImage: "text.alignleft")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.6))
                        Text(assignment.description)
                            .font(.system(size: 15))
                            .foregroundStyle(.white.opacity(0.85))
                            .lineSpacing(4)
                    }
                    .glassCard()

                    Spacer(minLength: 40)
                }
                .padding(24)
            }
        }
        .overlay(alignment: .topTrailing) {
            Button { dismiss() } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 28))
                    .foregroundStyle(.white.opacity(0.5))
            }
            .padding(20)
        }
    }
}

struct InfoPill: View {
    let icon: String
    let text: String
    let color: Color

    var body: some View {
        Label(text, systemImage: icon)
            .font(.system(size: 13, weight: .medium))
            .foregroundStyle(color)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(color.opacity(0.15), in: Capsule())
            .overlay(Capsule().stroke(color.opacity(0.3), lineWidth: 0.5))
    }
}

// MARK: - Canvas Events List

struct CanvasEventsList: View {
    @ObservedObject var vm: CanvasViewModel

    var body: some View {
        ScrollView(showsIndicators: false) {
            LazyVStack(spacing: 10) {
                ForEach(vm.upcomingEvents) { event in
                    CanvasEventCard(event: event)
                }
                Spacer(minLength: 120)
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
        }
    }
}

struct CanvasEventCard: View {
    let event: CanvasEvent

    private var dateLabel: String {
        let f = DateFormatter()
        f.dateFormat = "EEE, MMM d · h:mm a"
        return f.string(from: event.startDate)
    }

    var body: some View {
        HStack(spacing: 16) {
            // Date column
            VStack(spacing: 2) {
                Text(event.startDate, format: .dateTime.day())
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                Text(event.startDate, format: .dateTime.month(.abbreviated))
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.5))
                    .textCase(.uppercase)
            }
            .frame(width: 44)

            Rectangle()
                .fill(event.courseColor)
                .frame(width: 2)
                .cornerRadius(1)

            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Image(systemName: event.type.icon)
                        .font(.system(size: 12))
                        .foregroundStyle(event.courseColor)
                    Text(event.type.rawValue)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(event.courseColor)
                    Spacer()
                }
                Text(event.title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.white)

                HStack(spacing: 12) {
                    Label(event.course, systemImage: "book.fill")
                    if let loc = event.location {
                        Label(loc, systemImage: "mappin")
                    }
                }
                .font(.system(size: 11))
                .foregroundStyle(.white.opacity(0.45))
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.surfacePrimary)
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(Color.borderSubtle, lineWidth: 0.5)
                )
        )
    }
}

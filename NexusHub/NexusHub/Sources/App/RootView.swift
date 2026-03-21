import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ZStack(alignment: .bottom) {
            // Background mesh gradient
            MeshBackgroundView()
                .ignoresSafeArea()

            // Page content
            TabContentView()

            // Custom floating tab bar
            FloatingTabBar()
                .padding(.bottom, 8)
        }
        .ignoresSafeArea(edges: .bottom)
    }
}

// MARK: - Tab Content

struct TabContentView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ZStack {
            DashboardView()
                .opacity(appState.selectedTab == .dashboard ? 1 : 0)
            CanvasView()
                .opacity(appState.selectedTab == .canvas ? 1 : 0)
            MailView()
                .opacity(appState.selectedTab == .mail ? 1 : 0)
            CalendarView()
                .opacity(appState.selectedTab == .calendar ? 1 : 0)
            RemindersView()
                .opacity(appState.selectedTab == .reminders ? 1 : 0)
        }
        .animation(.easeInOut(duration: 0.2), value: appState.selectedTab)
    }
}

// MARK: - Mesh Background

struct MeshBackgroundView: View {
    @State private var animPhase: Double = 0

    var body: some View {
        ZStack {
            Color.black

            // Soft ambient blobs
            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color(red: 0.15, green: 0.10, blue: 0.40).opacity(0.6), .clear],
                        center: .center, startRadius: 0, endRadius: 280
                    )
                )
                .frame(width: 520, height: 520)
                .offset(x: -80, y: -200 + CGFloat(sin(animPhase) * 20))
                .blur(radius: 40)

            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color(red: 0.05, green: 0.20, blue: 0.40).opacity(0.5), .clear],
                        center: .center, startRadius: 0, endRadius: 240
                    )
                )
                .frame(width: 440, height: 440)
                .offset(x: 120, y: 280 + CGFloat(cos(animPhase) * 15))
                .blur(radius: 50)

            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color(red: 0.30, green: 0.05, blue: 0.20).opacity(0.4), .clear],
                        center: .center, startRadius: 0, endRadius: 200
                    )
                )
                .frame(width: 360, height: 360)
                .offset(x: 60, y: 80 + CGFloat(sin(animPhase + 1) * 18))
                .blur(radius: 45)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 6).repeatForever(autoreverses: true)) {
                animPhase = .pi
            }
        }
    }
}

// MARK: - Floating Tab Bar

struct FloatingTabBar: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        HStack(spacing: 0) {
            ForEach(AppState.Tab.allCases, id: \.rawValue) { tab in
                TabBarButton(tab: tab)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 28, style: .continuous)
                        .stroke(Color.borderSubtle, lineWidth: 0.5)
                )
        )
        .shadow(color: .black.opacity(0.4), radius: 30, x: 0, y: 10)
        .padding(.horizontal, 20)
    }
}

struct TabBarButton: View {
    @EnvironmentObject private var appState: AppState
    let tab: AppState.Tab
    @State private var isPressed = false

    private var isSelected: Bool { appState.selectedTab == tab }
    private var badgeCount: Int {
        switch tab {
        case .canvas:    return appState.unreadCounts.canvas
        case .mail:      return appState.unreadCounts.mail
        case .calendar:  return appState.unreadCounts.calendar
        case .reminders: return appState.unreadCounts.reminders
        default:         return 0
        }
    }

    var body: some View {
        Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                appState.selectedTab = tab
            }
        } label: {
            VStack(spacing: 4) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: tab.icon)
                        .font(.system(size: 20, weight: isSelected ? .semibold : .regular))
                        .foregroundStyle(
                            isSelected
                                ? tab.accentColor
                                : Color.white.opacity(0.4)
                        )
                        .frame(width: 44, height: 30)
                        .scaleEffect(isPressed ? 0.88 : 1.0)

                    if badgeCount > 0 && !isSelected {
                        Text("\(min(badgeCount, 99))")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 2)
                            .background(tab.accentColor, in: Capsule())
                            .offset(x: 4, y: -4)
                    }
                }

                Text(tab.title)
                    .font(.system(size: 10, weight: isSelected ? .semibold : .regular))
                    .foregroundStyle(
                        isSelected
                            ? tab.accentColor
                            : Color.white.opacity(0.4)
                    )
            }
        }
        .frame(maxWidth: .infinity)
        .buttonStyle(.plain)
        ._onButtonGesture(pressing: { p in
            withAnimation(.easeInOut(duration: 0.1)) { isPressed = p }
        }, perform: {})
    }
}

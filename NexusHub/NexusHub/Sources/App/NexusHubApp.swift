import SwiftUI
import UserNotifications

@main
struct NexusHubApp: App {
    @StateObject private var appState = AppState()

    init() {
        requestNotificationPermissions()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .preferredColorScheme(.dark)
        }
    }

    private func requestNotificationPermissions() {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .badge, .sound]
        ) { _, _ in }
    }
}

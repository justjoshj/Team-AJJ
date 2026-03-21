import SwiftUI

struct MailView: View {
    @StateObject private var vm = MailViewModel()
    @State private var selectedMessage: MailMessage? = nil

    var body: some View {
        VStack(spacing: 0) {
            MailHeader(vm: vm)

            ScrollView(showsIndicators: false) {
                LazyVStack(spacing: 8) {
                    ForEach(vm.filteredMessages) { message in
                        MailRow(message: message)
                            .onTapGesture {
                                vm.markRead(message)
                                selectedMessage = message
                            }
                    }
                    Spacer(minLength: 120)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
            }
        }
        .ignoresSafeArea(edges: .top)
        .sheet(item: $selectedMessage) { msg in
            MailDetailSheet(message: msg, vm: vm)
        }
    }
}

// MARK: - Header

struct MailHeader: View {
    @ObservedObject var vm: MailViewModel

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 8) {
                        Image(systemName: "envelope.fill")
                            .foregroundStyle(Color.mailBlue)
                        Text("Mail")
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                    }
                    Text("\(vm.unreadCount) unread")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.5))
                }
                Spacer()

                // Compose button
                Button {
                } label: {
                    Image(systemName: "square.and.pencil")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundStyle(Color.mailBlue)
                        .frame(width: 40, height: 40)
                        .background(.ultraThinMaterial, in: Circle())
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 60)
            .padding(.bottom, 14)

            // Search bar
            HStack(spacing: 10) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(.white.opacity(0.4))
                    .font(.system(size: 14))
                TextField("Search mail...", text: $vm.searchText)
                    .font(.system(size: 14))
                    .foregroundStyle(.white)
                    .tint(.white)
                if !vm.searchText.isEmpty {
                    Button { vm.searchText = "" } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.white.opacity(0.4))
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(Color.borderSubtle, lineWidth: 0.5)
            )
            .padding(.horizontal, 20)
            .padding(.bottom, 12)

            // Category chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    FilterChip(title: "All", isSelected: vm.selectedCategory == nil, color: .white) {
                        vm.selectedCategory = nil
                    }
                    ForEach(MailMessage.Category.allCases, id: \.self) { cat in
                        FilterChip(
                            title: cat.rawValue,
                            isSelected: vm.selectedCategory == cat,
                            color: cat.color
                        ) {
                            vm.selectedCategory = vm.selectedCategory == cat ? nil : cat
                        }
                    }
                }
                .padding(.horizontal, 20)
            }
            .padding(.bottom, 10)
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

// MARK: - Mail Row

struct MailRow: View {
    let message: MailMessage

    var body: some View {
        HStack(spacing: 12) {
            AvatarCircle(text: message.senderInitials, color: message.senderColor)

            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .firstTextBaseline) {
                    Text(message.sender)
                        .font(.system(size: 14, weight: message.isRead ? .regular : .bold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    Spacer()
                    Text(message.timeAgo)
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.4))
                }

                Text(message.subject)
                    .font(.system(size: 13, weight: message.isRead ? .regular : .medium))
                    .foregroundStyle(message.isRead ? .white.opacity(0.65) : .white)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    Text(message.preview)
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.38))
                        .lineLimit(1)
                    Spacer()
                    HStack(spacing: 6) {
                        if message.hasAttachment {
                            Image(systemName: "paperclip")
                                .font(.system(size: 11))
                                .foregroundStyle(.white.opacity(0.4))
                        }
                        if message.isStarred {
                            Image(systemName: "star.fill")
                                .font(.system(size: 11))
                                .foregroundStyle(.yellow)
                        }
                    }
                }
            }

            if !message.isRead {
                Circle()
                    .fill(Color.mailBlue)
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 13)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(message.isRead ? Color.surfacePrimary : Color.mailBlue.opacity(0.06))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.borderSubtle, lineWidth: 0.5)
                )
        )
    }
}

// MARK: - Mail Detail Sheet

struct MailDetailSheet: View {
    let message: MailMessage
    @ObservedObject var vm: MailViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            MeshBackgroundView().ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 24) {

                    // From / meta
                    HStack(spacing: 14) {
                        AvatarCircle(text: message.senderInitials, color: message.senderColor, size: 46)

                        VStack(alignment: .leading, spacing: 4) {
                            Text(message.sender)
                                .font(.system(size: 17, weight: .bold))
                                .foregroundStyle(.white)
                            Text(message.date, style: .date)
                                .font(.system(size: 12))
                                .foregroundStyle(.white.opacity(0.45))
                        }

                        Spacer()

                        Button { vm.toggleStar(message) } label: {
                            Image(systemName: message.isStarred ? "star.fill" : "star")
                                .foregroundStyle(message.isStarred ? .yellow : .white.opacity(0.4))
                                .font(.system(size: 20))
                        }
                    }

                    // Subject
                    Text(message.subject)
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .lineSpacing(2)

                    // Category badge
                    HStack {
                        Label(message.category.rawValue, systemImage: message.category.icon)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(message.category.color)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(message.category.color.opacity(0.15), in: Capsule())
                        if message.hasAttachment {
                            Label("Attachment", systemImage: "paperclip")
                                .font(.system(size: 12))
                                .foregroundStyle(.white.opacity(0.5))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(Color.surfacePrimary, in: Capsule())
                        }
                    }

                    Divider().background(Color.borderSubtle)

                    // Body
                    Text(message.body)
                        .font(.system(size: 15))
                        .foregroundStyle(.white.opacity(0.85))
                        .lineSpacing(5)

                    Spacer(minLength: 50)
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

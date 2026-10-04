import SwiftUI
import MapKit

@main
struct BrickApp: App {
    @State private var store = Store()

    var body: some Scene {
        WindowGroup {
            TabView {
                BrowseView().tabItem { Label("Browse", systemImage: "map") }
                SavedView().tabItem { Label("Saved", systemImage: "heart") }
            }
            .environment(store)
        }
    }
}

struct BrowseView: View {
    @Environment(Store.self) private var store
    @State private var query = ""
    @State private var results: [Place] = []
    @State private var camera: MapCameraPosition = .automatic
    @State private var selected: Listing?

    var body: some View {
        @Bindable var store = store
        NavigationStack {
            VStack(spacing: 0) {
                Map(position: $camera) {
                    ForEach(store.listings) { l in
                        Annotation(l.priceText, coordinate: .init(latitude: l.lat, longitude: l.lng)) {
                            Button { selected = l } label: { PricePill(text: l.priceText) }.buttonStyle(.plain)
                        }
                        .annotationTitles(.hidden)
                    }
                }
                .frame(maxHeight: 260)

                Group {
                    if store.loading && store.listings.isEmpty {
                        ProgressView().frame(maxHeight: .infinity)
                    } else if store.listings.isEmpty {
                        ContentUnavailableView(
                            store.failed ? "Could not load listings" : "No listings here yet",
                            systemImage: store.failed ? "wifi.slash" : "house",
                            description: Text(store.failed ? "Check your connection and pull to try again." : "Brick only shows real listings. Try a bigger city nearby.")
                        )
                    } else {
                        List(store.listings) { l in
                            NavigationLink(value: l) { ListingRow(listing: l) }
                        }
                        .listStyle(.plain)
                    }
                }
                .refreshable { await store.load() }
            }
            .navigationTitle(store.place.name)
            .navigationBarTitleDisplayMode(.inline)
            .navigationDestination(for: Listing.self) { ListingDetail(listing: $0) }
            .navigationDestination(item: $selected) { ListingDetail(listing: $0) }
            .toolbar {
                if store.modes.count > 1 {
                    ToolbarItem(placement: .topBarTrailing) {
                        Picker("Mode", selection: $store.mode) {
                            Text("Rent").tag("rent")
                            Text("Buy").tag("sale")
                        }
                        .pickerStyle(.segmented)
                    }
                }
            }
            .searchable(text: $query, prompt: "Search any city")
            .searchSuggestions {
                ForEach(results) { p in
                    Button {
                        store.place = p
                        query = ""
                        results = []
                    } label: {
                        VStack(alignment: .leading) {
                            Text(p.name)
                            Text(p.detail).font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .task(id: query) {
                guard query.count > 1 else { results = []; return }
                // Nominatim allows one request a second, so wait for a pause in typing.
                try? await Task.sleep(for: .milliseconds(600))
                guard !Task.isCancelled else { return }
                results = await store.search(query)
            }
            .task(id: "\(store.place.id)-\(store.mode)") {
                store.listings = []
                camera = .region(.init(center: .init(latitude: store.place.lat, longitude: store.place.lng),
                                       span: .init(latitudeDelta: 0.12, longitudeDelta: 0.12)))
                await store.load()
                // App Store screenshots: `-shot-detail` opens the first home.
                if ProcessInfo.processInfo.arguments.contains("-shot-detail") { selected = store.listings.first }
            }
        }
    }
}

struct PricePill: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.caption2.weight(.semibold))
            .padding(.horizontal, 7).padding(.vertical, 4)
            .background(.background, in: Capsule())
            .overlay(Capsule().stroke(.tint, lineWidth: 1))
            .foregroundStyle(.primary)
    }
}

struct Photo: View {
    let url: String?
    var width = 640

    // Feed photos are full-size originals; wsrv.nl serves a resized WebP, same as the web app.
    private var resized: URL? {
        guard let url, url.hasPrefix("http"),
              let q = url.addingPercentEncoding(withAllowedCharacters: .alphanumerics) else { return nil }
        return URL(string: "https://wsrv.nl/?url=\(q)&w=\(width)&h=\(width * 11 / 16)&fit=cover&output=webp&q=72")
    }

    var body: some View {
        AsyncImage(url: resized) { phase in
            if let image = phase.image {
                image.resizable().scaledToFill()
            } else {
                Rectangle().fill(.quaternary).overlay { Image(systemName: "house").foregroundStyle(.secondary) }
            }
        }
    }
}

struct ListingRow: View {
    let listing: Listing

    var body: some View {
        HStack(spacing: 12) {
            Photo(url: listing.photos.first, width: 240)
                .frame(width: 96, height: 72)
                .clipShape(RoundedRectangle(cornerRadius: 10))
            VStack(alignment: .leading, spacing: 3) {
                Text(listing.priceText).font(.headline)
                Text(listing.statsText).font(.subheadline).foregroundStyle(.secondary)
                Text(listing.address ?? listing.city ?? "").font(.footnote).foregroundStyle(.secondary).lineLimit(1)
            }
        }
        .accessibilityElement(children: .combine)
    }
}

struct ListingDetail: View {
    @Environment(Store.self) private var store
    let listing: Listing

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                TabView {
                    ForEach(listing.photos.isEmpty ? [""] : listing.photos, id: \.self) { p in
                        Photo(url: p.isEmpty ? nil : p, width: 1200).frame(maxWidth: .infinity).clipped()
                    }
                }
                .tabViewStyle(.page)
                .frame(height: 280)

                VStack(alignment: .leading, spacing: 6) {
                    Text(listing.priceText).font(.largeTitle.bold())
                    Text(listing.statsText).font(.title3).foregroundStyle(.secondary)
                    Text(listing.address ?? listing.city ?? "")
                    if let days = listing.listedDaysAgo {
                        Text(days == 0 ? "Listed today" : "Listed \(days) days ago").font(.footnote).foregroundStyle(.secondary)
                    }
                }
                .padding(.horizontal)

                Map(initialPosition: .region(.init(center: .init(latitude: listing.lat, longitude: listing.lng),
                                                   span: .init(latitudeDelta: 0.02, longitudeDelta: 0.02)))) {
                    Marker(listing.priceText, coordinate: .init(latitude: listing.lat, longitude: listing.lng))
                }
                .frame(height: 200)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .padding(.horizontal)
                .allowsHitTesting(false)

                if let link = listing.url.flatMap(URL.init) {
                    Link(destination: link) {
                        Text("View original listing").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .padding(.horizontal)
                }
            }
            .padding(.bottom)
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            Button { store.toggle(listing) } label: {
                Image(systemName: store.isSaved(listing) ? "heart.fill" : "heart")
            }
            .accessibilityLabel(store.isSaved(listing) ? "Remove from saved" : "Save")
        }
    }
}

struct SavedView: View {
    @Environment(Store.self) private var store

    var body: some View {
        NavigationStack {
            Group {
                if store.saved.isEmpty {
                    ContentUnavailableView("Nothing saved", systemImage: "heart", description: Text("Tap the heart on a home to keep it here."))
                } else {
                    List {
                        ForEach(store.saved) { l in
                            NavigationLink(value: l) { ListingRow(listing: l) }
                        }
                        .onDelete { store.saved.remove(atOffsets: $0) }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Saved")
            .navigationDestination(for: Listing.self) { ListingDetail(listing: $0) }
        }
    }
}

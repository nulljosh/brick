import SwiftUI
import MapKit

@main
struct BrickApp: App {
    @State private var store = Store()

    var body: some Scene {
        WindowGroup {
            BrowseView().environment(store)
        }
    }
}

// The map fills the screen. Listings live in a glass sheet that rides over it,
// the way Maps does it: drag it down for the map, up for the list.
struct BrowseView: View {
    @Environment(Store.self) private var store
    @State private var camera: MapCameraPosition = .automatic
    @State private var sheet = true
    @State private var detent: PresentationDetent = .fraction(0.45)

    var body: some View {
        Map(position: $camera) {
            ForEach(store.listings) { l in
                Annotation(l.priceText, coordinate: .init(latitude: l.lat, longitude: l.lng)) {
                    PricePill(text: l.priceText, deal: l.deal >= 5)
                }
                .annotationTitles(.hidden)
            }
        }
        .mapStyle(.standard(pointsOfInterest: .excludingAll))
        .ignoresSafeArea()
        .sheet(isPresented: $sheet) {
            ListingSheet(detent: $detent)
                .presentationDetents([.height(120), .fraction(0.45), .large], selection: $detent)
                .presentationBackgroundInteraction(.enabled(upThrough: .fraction(0.45)))
                .presentationCornerRadius(28)
                .interactiveDismissDisabled()
                .glassSheetBackground()
        }
        .task(id: "\(store.place.id)-\(store.mode)") {
            store.listings = []
            camera = .region(.init(center: .init(latitude: store.place.lat - 0.04, longitude: store.place.lng),
                                   span: .init(latitudeDelta: 0.22, longitudeDelta: 0.22)))
            await store.load()
        }
    }
}

extension View {
    // iOS 26 sheets are Liquid Glass at partial heights on their own; earlier
    // systems get the thin material so the map still shows through.
    @ViewBuilder func glassSheetBackground() -> some View {
        if #available(iOS 26, *) { self } else { presentationBackground(.ultraThinMaterial) }
    }

    @ViewBuilder func glassPill() -> some View {
        if #available(iOS 26, *) { glassEffect(.regular, in: Capsule()) } else { background(.ultraThinMaterial, in: Capsule()) }
    }
}

struct ListingSheet: View {
    @Environment(Store.self) private var store
    @Binding var detent: PresentationDetent
    @State private var query = ""
    @State private var results: [Place] = []

    var body: some View {
        @Bindable var store = store
        NavigationStack {
            Group {
                if store.loading && store.listings.isEmpty {
                    VStack(spacing: 12) {
                        ProgressView()
                        Text("Pulling live listings for \(store.place.name)").font(.footnote).foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if store.listings.isEmpty {
                    ContentUnavailableView(
                        store.failed ? "Could not load listings" : "No listings here yet",
                        systemImage: store.failed ? "wifi.slash" : "house",
                        description: Text(store.failed ? "Check your connection and pull to try again." : "Brick only shows real listings. Try a bigger town nearby.")
                    )
                } else {
                    List {
                        Section {
                            ForEach(store.listings) { l in
                                NavigationLink(value: l) { ListingRow(listing: l) }
                                    .listRowBackground(Color.clear)
                            }
                        } header: {
                            Text("\(store.listings.count) real homes, best deals first")
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }
            }
            .refreshable { await store.load() }
            .navigationTitle(store.place.name)
            .navigationBarTitleDisplayMode(.inline)
            .navigationDestination(for: Listing.self) { ListingDetail(listing: $0) }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    NavigationLink { SavedView() } label: { Image(systemName: "heart") }
                        .accessibilityLabel("Saved homes")
                }
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
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search any town")
            .searchSuggestions {
                ForEach(results) { p in
                    Button {
                        store.place = p
                        query = ""
                        results = []
                        detent = .fraction(0.45)
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
        }
    }
}

struct PricePill: View {
    let text: String
    var deal = false

    var body: some View {
        Text(text)
            .font(.caption2.weight(.semibold))
            .padding(.horizontal, 8).padding(.vertical, 5)
            .glassPill()
            .overlay(Capsule().stroke(deal ? Color.green : Color.accentColor, lineWidth: deal ? 1.5 : 1))
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
                HStack(spacing: 6) {
                    Text(listing.priceText).font(.headline)
                    if listing.deal >= 5 {
                        Text("\(listing.deal)% under typical")
                            .font(.caption2.weight(.semibold))
                            .padding(.horizontal, 6).padding(.vertical, 2)
                            .background(.green.opacity(0.14), in: Capsule())
                            .foregroundStyle(.green)
                    }
                }
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
                    if listing.deal >= 5 {
                        Text("\(listing.deal)% under typical for its size nearby").font(.subheadline.weight(.semibold)).foregroundStyle(.green)
                    }
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
        Group {
            if store.saved.isEmpty {
                ContentUnavailableView("Nothing saved", systemImage: "heart", description: Text("Tap the heart on a home to keep it here."))
            } else {
                List {
                    ForEach(store.saved) { l in
                        NavigationLink(value: l) { ListingRow(listing: l) }
                            .listRowBackground(Color.clear)
                    }
                    .onDelete { store.saved.remove(atOffsets: $0) }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .navigationTitle("Saved")
    }
}

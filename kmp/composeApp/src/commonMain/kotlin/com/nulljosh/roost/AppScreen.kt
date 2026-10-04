package com.nulljosh.roost

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

@Composable
fun RoostTheme(content: @Composable () -> Unit) =
    MaterialTheme(colorScheme = lightColorScheme(), content = content)

// ponytail: no real street anchors (Overpass not ported, see Geo.kt) and no
// i18n (the web app has 25 languages, this is English-only). Search +
// seeded listing generation are both real and match the web app's output
// shape and math.
@Composable
fun AppScreen(geo: GeoClient = GeoClient()) {
    var query by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<List<Place>>(emptyList()) }
    var place by remember { mutableStateOf(DEFAULT_PLACE) }
    var mode by remember { mutableStateOf("sale") }
    val listings = remember(place, mode) { generateListings(place, mode) }
    val scope = rememberCoroutineScope()

    fun search() {
        scope.launch { runCatching { results = geo.searchPlaces(query) } }
    }

    Surface {
        Column(Modifier.fillMaxSize().padding(24.dp)) {
            Text("Brick", style = MaterialTheme.typography.headlineMedium)
            Text("Browsing ${place.label}", modifier = Modifier.padding(top = 4.dp))
            Row(Modifier.padding(top = 16.dp)) {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    label = { Text("Search a city") },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            Button(onClick = { search() }, modifier = Modifier.padding(top = 8.dp)) { Text("Search") }
            results.forEach { p ->
                Button(
                    onClick = { place = p; results = emptyList(); query = "" },
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                ) { Text(p.label) }
            }
            Row(Modifier.padding(top = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = { mode = "sale" }) { Text("For sale") }
                Button(onClick = { mode = "rent" }) { Text("For rent") }
            }
            LazyColumn(
                modifier = Modifier.padding(top = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(listings) { l ->
                    Column {
                        Text(l.address, style = MaterialTheme.typography.titleMedium)
                        Text("${formatMoney(l.price, l.currency)} - ${l.beds} bd / ${l.baths} ba - ${formatArea(l.sqft, l.imperial)}")
                    }
                }
            }
        }
    }
}

(function () {
  var WMO_ICONS = {
    0: 'fa-sun',
    1: 'fa-cloud-sun', 2: 'fa-cloud-sun', 3: 'fa-cloud',
    45: 'fa-smog', 48: 'fa-smog',
    51: 'fa-cloud-rain', 53: 'fa-cloud-rain', 55: 'fa-cloud-rain',
    56: 'fa-cloud-rain', 57: 'fa-cloud-rain',
    61: 'fa-cloud-showers-heavy', 63: 'fa-cloud-showers-heavy', 65: 'fa-cloud-showers-heavy',
    66: 'fa-cloud-showers-heavy', 67: 'fa-cloud-showers-heavy',
    71: 'fa-snowflake', 73: 'fa-snowflake', 75: 'fa-snowflake', 77: 'fa-snowflake',
    80: 'fa-cloud-showers-heavy', 81: 'fa-cloud-showers-heavy', 82: 'fa-cloud-showers-heavy',
    85: 'fa-snowflake', 86: 'fa-snowflake',
    95: 'fa-bolt', 96: 'fa-bolt', 99: 'fa-bolt'
  };

  function getWeatherIcon(code) {
    return WMO_ICONS[code] || 'fa-cloud';
  }

  function showStatus(msg) {
    var widget = document.getElementById('weather-widget');
    if (widget) {
      widget.innerHTML = '<span class="weather-city">' + msg + '</span>';
      widget.style.opacity = '1';
    }
  }

  function renderWeather(weather, cityName) {
    var current = weather.current;
    var daily = weather.daily;
    var iconClass = getWeatherIcon(current.weather_code);

    document.getElementById('weather-icon').innerHTML =
      '<i class="fa-solid ' + iconClass + '"></i>';
    document.getElementById('weather-temp').textContent =
      Math.round(current.temperature_2m) + '\u00B0F';

    var hi = Math.round(daily.temperature_2m_max[0]);
    var lo = Math.round(daily.temperature_2m_min[0]);
    document.getElementById('weather-hilo').textContent =
      'H:' + hi + '\u00B0 L:' + lo + '\u00B0';
    document.getElementById('weather-city').textContent = cityName;
    document.getElementById('weather-widget').style.opacity = '1';
  }

  function tryBrowserGeo() {
    return new Promise(function (resolve) {
      if (!navigator.geolocation) {
        console.log('[Weather] No geolocation API');
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          console.log('[Weather] Browser geolocation OK');
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        function (err) {
          console.log('[Weather] Browser geolocation failed:', err.code, err.message);
          resolve(null);
        },
        { timeout: 8000, enableHighAccuracy: false }
      );
    });
  }

  function tryIPGeo() {
    return fetch('https://get.geojs.io/v1/ip/geo.json')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.latitude && d.longitude) {
          console.log('[Weather] GeoJS IP location OK');
          return { lat: parseFloat(d.latitude), lon: parseFloat(d.longitude), city: d.city || '', region: d.region || '' };
        }
        return null;
      })
      .catch(function (e) {
        console.log('[Weather] GeoJS failed:', e.message);
        return null;
      });
  }

  function tryIPGeo2() {
    return fetch('https://ipwho.is/')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.success !== false && d.latitude && d.longitude) {
          console.log('[Weather] ipwho.is location OK');
          return { lat: d.latitude, lon: d.longitude, city: d.city || '', region: d.region || '' };
        }
        return null;
      })
      .catch(function (e) {
        console.log('[Weather] ipwho.is failed:', e.message);
        return null;
      });
  }

  async function init() {
    var widget = document.getElementById('weather-widget');
    if (!widget) return;

    if (window.location.protocol === 'file:') {
      showStatus('Serve via HTTP for weather');
      console.error('[Weather] file:// protocol detected — fetch and geolocation are blocked. Use a local HTTP server.');
      return;
    }

    try {
      var loc = await tryBrowserGeo();

      if (!loc) {
        loc = await tryIPGeo();
      }
      if (!loc) {
        loc = await tryIPGeo2();
      }
      if (!loc) {
        showStatus('Location unavailable');
        return;
      }

      var weatherUrl = 'https://api.open-meteo.com/v1/forecast'
        + '?latitude=' + loc.lat.toFixed(4)
        + '&longitude=' + loc.lon.toFixed(4)
        + '&current=temperature_2m,weather_code'
        + '&daily=temperature_2m_max,temperature_2m_min'
        + '&temperature_unit=fahrenheit'
        + '&timezone=auto'
        + '&forecast_days=1';

      console.log('[Weather] Fetching forecast…');
      var resp = await fetch(weatherUrl);
      var weather = await resp.json();

      var cityName = '';
      if (loc.city) {
        cityName = loc.city + (loc.region ? ', ' + loc.region : '');
      } else {
        try {
          var geoResp = await fetch('https://nominatim.openstreetmap.org/reverse?lat='
            + loc.lat.toFixed(4) + '&lon=' + loc.lon.toFixed(4) + '&format=json');
          var geo = await geoResp.json();
          if (geo && geo.address) {
            var name = geo.address.city || geo.address.town || geo.address.village || geo.address.county || '';
            var state = geo.address.state || '';
            cityName = name && state ? name + ', ' + state : name || state;
          }
        } catch (e) {
          console.log('[Weather] Reverse geocode failed:', e.message);
        }
      }

      renderWeather(weather, cityName);
      console.log('[Weather] Done!');

    } catch (err) {
      console.error('[Weather] Fatal error:', err);
      showStatus('Weather error');
    }
  }

  init();
})();

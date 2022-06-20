/**
 * Load TopoJSON data of the world and the data of the world wonders
 */

// Add your code here

Promise.all([
    d3.json('data/countries-110m_v2.json'),
    d3.csv('data/worldcities_v2.csv')
]).then(data => {
    data[1].forEach(d => {
        d.population = +d.population;
    })

    const geoMap = new GeoMap({
        parentElement: '#map'
    }, data[0], data[1]);
})
    .catch(error => console.error(error));
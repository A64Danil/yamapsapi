/**
 * Created by Danil on 27.04.2018.
 */

console.log('Node JS working. Тест русских символов')





function vkAPI(method, options) {
    if (!options.v) {options.v = '5.68'}

    return new Promise((resolve, reject) => {
        VK.api(method, options, data => {
            if (data.error) {
                reject(new Error(data.error.error_msg));
            } else {
                resolve(data.response);
            }
        });
    });
}



function vkInit() {
    return new Promise( (resolve, reject) => {
        VK.init({
            apiId: 6455962
        });

        VK.Auth.login(data => {
            if (data.session) {
                console.log('auth ok'); resolve();
            } else {
                reject(new Error('Не удалось авторизоваться в ВК'));
            }
            }, 4 | 8 );
    });
}

function geocode(address) {
    return ymaps.geocode(address).then(result => {
        const points = result.geoObjects.toArray();

        if (points.length) {
            return points[0].geometry.getCoordinates();
        }
    });
}

var myMap;
var tmp;
var tmp2;
var clusterer;

new Promise(resolve => ymaps.ready(resolve))
    .then(() => vkInit())
    .then(() => vkAPI('friends.get', { fields : 'city,country' }))
    .then(friends => {
        myMap = new ymaps.Map('map', {
            center: [55.76, 37.64],
            zoom: 7
        }, {
            searchControlProvider: 'yandex#search'
        });
        clusterer = new ymaps.Clusterer({
            preset: 'islands#invertedVioletClusterIcons',
            clusterDisableClickZoom: true,
            openBalloonOnClick: false
        });

        myMap.geoObjects.add(clusterer);

        return friends.items;
    })
    .then(friends => {
        tmp = friends.filter(friend => friend.country && friend.country.title).map(friend => {
                let parts = friend.country.title;
                if (friend.city) {
                    parts += ' ' + friend.city.title;
                }

                return parts;
            })
        tmp2 = tmp.map(geocode);
        const promises = tmp2;
        return Promise.all(promises);
    })
    .then(coords => {
        console.log(coords);
        const placemarks = coords.map(coord => {
            return new ymaps.Placemark(coord, {}, { preset: 'islands#blueHomeCircleIcon'})
        })

        clusterer.add(placemarks);
    })
    .catch(e => console.log('Ошибка ' + e))
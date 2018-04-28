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

function geocode(human) {
    return ymaps.geocode(human.geo).then(result => {
        points = result.geoObjects.toArray();
        if (points.length) {
            human.geo = points[0].geometry.getCoordinates();
        }

        return human
    });
}

var myMap;
var tmp;
var tmp2;
var clusterer;

new Promise(resolve => ymaps.ready(resolve))
    .then(() => vkInit())
    .then(() => vkAPI('friends.get', { fields : 'city,country,bdate,photo_100' }))
    .then(friends => {
        console.log(friends);
        myMap = new ymaps.Map('map', {
            center: [55.76, 37.64],
            zoom: 8
        }, {
            searchControlProvider: 'yandex#search'
        });
        clusterer = new ymaps.Clusterer({
            preset: 'islands#invertedVioletClusterIcons',
            clusterDisableClickZoom: true,
            openBalloonOnClick: true
        });

        myMap.geoObjects.add(clusterer);

        return friends.items;
    })
    .then(friends => {
        tmp = friends.filter(friend => friend.country && friend.country.title).map(friend => {
                //let parts = friend.country.title;
                let humans = {
                    name: friend.first_name,
                    secName: friend.last_name,
                    geo: friend.country.title,
                    photo: friend.photo_100,
                    bdate: friend.bdate
                };
                if (friend.city) {
                    //parts += ' ' + friend.city.title;
                    humans.geo += ' ' + friend.city.title;
                }

                //console.log(humans);
                return humans;
            })
        tmp2 = tmp.map(geocode);
        const promises = tmp2;
        console.log(tmp2);
        return Promise.all(promises);
    })
    .then(humans => {
        console.log(humans);
        const placemarks = humans.map(human => {
            return new ymaps.Placemark(human.geo, {
                balloonContentHeader: human.name + ' ' + human.secName,
                balloonContentBody: '<img src="' + human.photo + '">',
                balloonContentFooter: 'Д.Р.: ' + human.bdate,
                hintContent: 'Тут живет ' + human.name + ' ' + human.secName
            }, {
                preset: 'islands#blueHomeCircleIcon',
                openBalloonOnClick: true
            })
        })
        console.log(placemarks);
        clusterer.add(placemarks);
    })
    .catch(e => console.log('Ошибка ' + e))
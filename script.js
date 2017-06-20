var worker,
    last,
    ended = true;

function getHiddenProp(){
    var prefixes = ['webkit','moz','ms','o'];

    // если скрыто поддерживается только return
    if ('hidden' in document) return 'hidden';

    // перебрать все известные префиксы пока не найдем нужный
    for (var i = 0; i < prefixes.length; i++){
    if ((prefixes[i] + 'Hidden') in document)
    return prefixes[i] + 'Hidden';
    }

    // это не поддерживается
    return null;
}

function visChange() {
    var timeout;
    
    if (isHidden())
        timeout = setTimeout(function(){
            var mailNotification = new Notification("Поиск", {
                tag : "ache-mail",
                body : "Страница неактивна уже целую минуту!",
                icon : "https://img.clipartfest.com/8c08c51dc5fdcfeca74e1fb9b33f0839_numbers-clip-art-number-clipart-free_300-400.jpeg"
            });
        }, 60000);
    else
        clearTimeout(timeout);
}

function isHidden() {
    var prop = getHiddenProp();
    if (!prop) return false;

    return document[prop];
}

window.onload = function(){
    navigator.geolocation.getCurrentPosition(
        function(position) {
            coords.innerHTML = 'Ваши координаты: ' + position.coords.latitude + ", " + position.coords.longitude;
        }
    );
    
    var visProp = getHiddenProp();
    
    if (visProp) {
        var evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
        document.addEventListener(evtname, visChange);
    }
    
    var startData = JSON.parse(localStorage["startData"] || null);
    var endData = JSON.parse(localStorage["endData"] || null);
    if(startData) {
        document.getElementById("from").value = startData.from;
        document.getElementById("to").value = startData.to;
    }
    
    if(endData) {
        var primeContainer = document.getElementById("primeContainer"), 
            statusDisplay = document.getElementById("status");

        statusDisplay.innerHTML = endData.status;
        primeContainer.innerHTML = endData.primeData;
        
        searchButton.innerHTML = 'Продолжить поиск';
        
        ended = false;
    }
}

function doSearch() {
    searchButton.disabled = true;
    stopButton.disabled = false;

    worker = new Worker("PrimeWorkers.js");

    worker.onmessage = receivedWorkerMessage;
    
    var startData = JSON.parse(localStorage["startData"] || null);
    
    if(ended) {
        primeContainer.innerHTML = '';
    }
    
    if(startData) {
        document.getElementById("from").value = startData.from;
        document.getElementById("to").value = startData.to;
        
        var endData = JSON.parse(localStorage["endData"] || null);
        
        if(endData) {            
            last = window.performance.now();
            worker.postMessage(
            { 
                from: startData.from,
                to: startData.to,
                startFrom: endData.prime
            }
            );
        } else {
            last = window.performance.now();
            worker.postMessage(
            { 
                from: startData.from,
                to: startData.to
            }
            );
        }
    } else {
        var fromNumber = document.getElementById("from").value;
        var toNumber = document.getElementById("to").value;
        
        last = window.performance.now();
        worker.postMessage(
        { 
            from: fromNumber,
            to: toNumber
        }
        );

        localStorage["startData"] = JSON.stringify({
            from: fromNumber,
            to: toNumber
        });
    } 
}

function receivedWorkerMessage(event) {
    var statusDisplay = document.getElementById("status"),
        endTime = window.performance.now();
    
    if(event.data.isFinished) {
        if (!primeContainer.innerHTML.trim()) {
            statusDisplay.innerHTML = "Ошибка поиска.";
        }
        else {
            statusDisplay.innerHTML = "Простые числа найдены!";
        }
        
        searchButton.innerHTML = 'Запустить поиск';
        
        searchButton.disabled = false;
        stopButton.disabled = true;
        
        localStorage.clear();
        
        ended = true;
        
        var mailNotification = new Notification("Поиск", {
            tag : "ache-mail",
            body : "Поиск простых чисел успешно завершен",
            icon : "https://i.ytimg.com/vi/glkQwKA5_PU/maxresdefault.jpg"
        });
        
        return;
    }
    
    var prime = event.data.prime,
        time = Math.round(endTime - last);
    
    last = endTime;

    if(primeContainer.innerHTML.trim()) {
        primeContainer.innerHTML += ', ';
    }

    primeContainer.innerHTML += prime.toString() + ':' + time + 'ms';
    
    var percent = event.data.percent;
    
    statusDisplay.innerHTML = percent + '% выполнено...';
    
    localStorage["endData"] = JSON.stringify({
        primeData: primeContainer.innerHTML,
        status: statusDisplay.innerHTML,
        prime: prime
    });
}

function cancelSearch() {
    var statusDisplay = document.getElementById("status");
    worker.terminate();
    worker = null;
    searchButton.innerHTML = 'Запустить поиск';
    statusDisplay.innerHTML = "Поток остановлен.";
    searchButton.disabled = false;
    stopButton.disabled = true;
    localStorage.clear();
    ended = true;
}
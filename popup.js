// Add click event listener
document.getElementById('run-button').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            function: cardRunnerFunc
        });
    });
});

// Define the function you want to inject
function cardRunnerFunc() {
    let runner = new CardRunner("product-row"); 
    runner.runIterations(4);
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


document.getElementById('clear-storage-button').addEventListener('click', function() {
    chrome.storage.local.clear(function() {
        var error = chrome.runtime.lastError;
        if (error) {
            console.error(error);
        } else {
            console.log("Cleared storage [chrome ext amex total rew]")
        }
    });
});

// Get the total value from localStorage when popup is opened
window.addEventListener('DOMContentLoaded', (event) => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            function: getLocalStorageItem
        }, results => {
            console.log(results);
            console.log("^^^^^ setting total");
            if(results && results[0] && results[0].result) {
                document.getElementById('total').textContent = numberWithCommas(results[0].result);
            }
        });
        
        // Define function separately
        function getLocalStorageItem() {
            console.log("Get total from local storage called");
            return new Promise((resolve, reject) => {
            chrome.storage.local.get('total', function(result) {
                console.log(result);
                console.log("^^^^ total in as dict ");
                resolve(result.total);
            });
            });
        }

        function getLocalStorageMyData() {
            return new Promise((resolve, reject) => {
            chrome.storage.local.get('myData', function(result) {
                console.log(result);
                console.log("^^^^ mydata as dict directly");
                resolve(result.myData);
            });
            });
        }


        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            function: getLocalStorageMyData
        },results => {
            console.log(results);
            if(results && results[0] && results[0].result) {
                let data = results[0].result;
                let cards = {};

                // Parse keys and group them by card name
                if(Object.keys(data).length !== 0) {
                    for (let key in data) {
                        let cardName = key.split('_')[0];
                        if (!cards[cardName]) {
                            cards[cardName] = {points: 0, expense: 0};
                        }
                        cards[cardName].points += data[key].points;
                        cards[cardName].expense += data[key].expense;
                    }
                    
                    // Display each card's total
                    let cardWiseDiv = document.getElementById('card-wise') || document.body;

                    let wrapperDiv = document.createElement('div');
                    wrapperDiv.classList.add('w-full', 'text-right');
                    cardWiseDiv.appendChild(wrapperDiv);

                    for (let cardName in cards) {
                        let card = document.createElement('div');
                        card.classList.add('flex', 'justify-between');

                        let cardNameElement = document.createElement('p');
                        cardNameElement.classList.add('font-mono','text-sm');
                        cardNameElement.textContent = cardName;
                        card.appendChild(cardNameElement);

                        let cardTotalElement = document.createElement('p');
                        cardTotalElement.classList.add('font-mono','text-sm');
                        cardTotalElement.textContent = numberWithCommas(cards[cardName].points) + " | " + ("\u20B9" + numberWithCommas(cards[cardName].expense.toFixed(0).toString())).padStart(11, "\u00A0");
                        card.appendChild(cardTotalElement);

                        wrapperDiv.appendChild(card);
                    }

                    let totalDiv = document.createElement('div');
                    totalDiv.classList.add('pt-2', 'border-t', 'border-gray-200', 'mt-2');

                    let totalText = document.createElement('p');
                    totalText.classList.add('font-bold', 'text-sm');
                    totalText.textContent = 'MR:' + ' ' + numberWithCommas(Object.values(cards).reduce((a, b) => a + b.points, 0));
                    totalDiv.appendChild(totalText);
                    wrapperDiv.appendChild(totalDiv);


                                
                }
            }

        });

    });
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.log(`${key} was ${oldValue} and is now ${newValue}`);
        
        if (key === "total") {  // If total value has changed
            let total = document.getElementById('total');
            console.log("Update total!");
            // Assuming 'newValue' is the new value you want to set
            total.textContent = numberWithCommas(newValue);
            
            total.classList.add('animate-total');
            
            // Remove the class after the animation completes (1 second in this case)
            setTimeout(() => {
                total.classList.remove('animate-total');
            }, 1000);
            
        }

        // or another key:

        if (key === "myData") {
          // Business logic when 'myData' value has been changed.
          // Parse keys and group them by card name
          var data = newValue;
          let cards = {};
          for (let key in data) {
            let cardName = key.split('_')[0];
            if (!cards[cardName]) {
                cards[cardName] = {points: 0, expense: 0};
            }
            cards[cardName].points += data[key].points;
            cards[cardName].expense += data[key].expense;
        }
        
          // Clear the div and display each card's total
          let cardWiseDiv = document.getElementById('card-wise') || document.body;
          while (cardWiseDiv.firstChild) {
              cardWiseDiv.removeChild(cardWiseDiv.firstChild);
          }

            let wrapperDiv = document.createElement('div');
            wrapperDiv.classList.add('w-full', 'text-right');
            cardWiseDiv.appendChild(wrapperDiv);

            for (let cardName in cards) {
                let card = document.createElement('div');
                card.classList.add('flex', 'justify-between');

                let cardNameElement = document.createElement('p');
                cardNameElement.classList.add('font-mono','text-sm');
                cardNameElement.textContent = cardName;
                card.appendChild(cardNameElement);

                let cardTotalElement = document.createElement('p');
                cardTotalElement.classList.add('font-mono','text-sm');
                cardTotalElement.textContent = numberWithCommas(cards[cardName].points) + " | " + ("\u20B9" + numberWithCommas(cards[cardName].expense.toFixed(0).toString())).padStart(11, "\u00A0");
                   card.appendChild(cardTotalElement);

                wrapperDiv.appendChild(card);
            }

            let totalDiv = document.createElement('div');
            totalDiv.classList.add('pt-2', 'border-t', 'border-gray-200', 'mt-2');

            let totalText = document.createElement('p');
            totalText.classList.add('font-bold', 'text-sm');
            totalText.textContent = 'MR:' + ' ' + numberWithCommas(Object.values(cards).reduce((a, b) => a + b.points, 0));
            totalDiv.appendChild(totalText);
            wrapperDiv.appendChild(totalDiv);



        }

        // and so on...
    }

    // Note: Call a function to update popup here if necessary
});

class CardRunner {
    constructor(className) {
      this.className = className;
    }
  
    clickCardExpand() {
      const buttons = document.getElementsByClassName("btn axp-account-switcher__accountSwitcher__togglerButton___1H_zk account-switcher-toggler");
      for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].getAttribute('aria-label') == 'open_title') {
          buttons[i].click();
          break;
        }
      }
    }
  
    clickOnButtonInCard(index) {
      let elements = document.getElementsByClassName(this.className);

      elements = Array.from(elements).filter(element => element.tagName.toLowerCase() === 'li');

      if (elements.length <= index) {
        console.warn('Invalid index given, not enough elements with class name: ' + this.className);
        return;
      }
      
      const button = elements[index].getElementsByTagName('button')[0];
      if (button) {
        button.click();
        return button.innerHTML; 
      } else {
        console.warn('No button found in the element with class name: ' + this.className);
      }
    }
  
    runShowMore() {
        return new Promise((resolve, reject) => {
          let intervalId = setInterval(() => {
            const buttons = document.getElementsByClassName('btn-block margin-tb');
            if (buttons.length > 0 && buttons[0].innerText.toLowerCase() === 'show more') {
              buttons[0].click();
            } else {
              clearInterval(intervalId);  // stop the interval when no more "show more" buttons found
              resolve();  // resolve the promise when finished
            }
          }, 2000); // 2000 ms = 2 seconds
        });
    }
    
    readPoints() {
        const divs = document.querySelectorAll('div.body-2.flex.flex-align-center.dls-gray-06.flex-justify-end');
        let data = {};

        for (let i = 0; i < divs.length; i++) {
            if (divs[i].style.width === "12%") {
                let number = parseFloat(divs[i].innerHTML.replace(/,/g, ''));
                let cardName = divs[i].parentNode.children[1].innerText;
                let expenseString = divs[i].parentNode.children[6].innerText;
                if (expenseString.includes("-") && expenseString.length >= 3) continue; // milestone rows just have "-"
                let expense = Number(expenseString.split('.')[0].replace(/[^0-9]/g, ''));
                if (number >= 0) {
                    let parentDivId = cardName + '_' + divs[i].parentNode.id;
                    data[parentDivId] = { "points": number, "expense": expense };
                }
            }
        }


        // retrieve the existing data from local storage (if any), parse it, and merge it with the new data
        chrome.storage.local.get('myData', function(result) {
            if (result.myData !== undefined) {
                console.log(result.myData);
                data = Object.assign(result.myData, data);
                let total = Object.values(data).reduce((a,b) => a + b.points, 0);

                chrome.storage.local.set({'myData': data, 'total': total}, function() {
                    console.log('Updated data and total set in storage');
                });
                console.log(total);
            }
            else {
                chrome.storage.local.set({'myData': data}, function() {
                    console.log('Data stored in chrome storage');
                });
            }
        });
    }
    
    async runIterations(iterations) {
        await new Promise(resolve => setTimeout(resolve, 3000));

      for (let index = 0; index < iterations; index++) {
        this.clickCardExpand();
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 2 seconds
        let cardName = this.clickOnButtonInCard(index);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 2 seconds
        let selectElement = document.querySelector('#time-filter');
        let optionsCount = selectElement.options.length;  // Get the number of options in select dropdown

        for (let i = 0; i < optionsCount; i++) {
            selectElement.value = selectElement.options[i].value;
            let event = new Event('change', { bubbles: true });
            selectElement.dispatchEvent(event);
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 2 seconds
            await this.runShowMore();
            await this.readPoints(cardName);
        }
        console.log("Completed action for card at index: " + index);
      }
    }
  };
  
//   let runner = new CardRunner('product-row'); // Change 'product-row' to actual class name
//   runner.runIterations(4);  // Runs the workflow for indexes 0 to 5.
  
  function clearLocalStorage() {
    chrome.storage.local.clear(function() {
        console.log('Local storage cleared');
    });
  }

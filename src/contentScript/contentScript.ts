// contentScript.ts

// Function to retrieve the search value from the YouTube page
function getSearchValue(): string | null {
  const searchInput = document.querySelector<HTMLInputElement>('input');
  return searchInput ? searchInput.value : null;
}

// Log the search value to the console
function logSearchValue(): void {
  const searchValue = getSearchValue();
  console.log('Search value:', searchValue);
}

// Send a message to the background script
chrome.runtime.sendMessage('I am loading content script', (response) => {
  console.log(response);
  console.log('I am content script');
});


window.onload = (event) => {
  console.log('page is fully loaded');
};
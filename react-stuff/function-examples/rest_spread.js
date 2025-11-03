// REST

function logAllArguments(...args) {
    console.log(args);
}

logAllArguments(1, 2, 3, 'a', 'b', 'c'); // Logs: [1, 2, 3, 'a', 'b', 'c']

export default logAllArguments;


function sumAll(num1, ...numbers) {
    return num1 + numbers.reduce((acc, curr) => acc + curr, 0);
}

console.log(sumAll(1, 2, 3, 4)); // Logs: 10

// SPREAD
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];

const combinedArray = [...arr1, ...arr2];
console.log(combinedArray); // Logs: [1, 2, 3, 4, 5, 6]

const obj1 = { a: 1, b: 2 };
const obj2 = { c: 3, d: 4 };

const combinedObject = { ...obj1, ...obj2 };  // Note: Order matters for properties with the same key
console.log(combinedObject) // Logs: { a: 1, b: 2, c: 3, d: 4 }
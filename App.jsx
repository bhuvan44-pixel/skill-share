import './App.css'
import Header from './header';

function App(){
    const name="Bhuvan";
    const age=19;

    return (
        <div>
        <Header>
        <h1>Hello,{name}</h1>
        <p>Age: {age}</p>
        <p>Next year: {age + 1}</p>
        </Header>
        </div>
    );
}

export default App;
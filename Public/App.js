
import React from 'react';
import {getAllCategories, getItems,CategoriesTitle} from '../Store/Grocery-store/index.js'


class App extends React.Component {
    constructor(props){
        super(props);
        this.state={  
            categories:[],          
            ItemsSelected:[],
            userId:'',
            userSelectedItems:[],
            visibleCategory:'',
            totalcategories:0,
            currentCategoryIndex:0,
            showNext:true,            
            showSubmit:false
        } 
        this.handleChange = this.handleChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleNextClick = this.handleNextClick.bind(this);       

    }
    componentDidMount()
    {
        const existingScript = document.getElementById('Messenger');        
        if (!existingScript) {
            const script = document.createElement("script");
            script.src = "//connect.facebook.com/en_US/messenger.Extensions.js";
            script.id="Messenger";
            script.async = true;
            document.body.appendChild(script);   
        }
        const params=new URLSearchParams(this.props.location.search);
        this.setState({userId:params.get("sid")});
        this.getAllCategories();    
    }
    getAllCategories()
    {
        let result=getAllCategories();
       this.setState({categories:result, totalcategories:(result.length -1),visibleCategory:result[0]});
    }
    handleClick(){
        MessengerExtensions.requestCloseBrowser(function success() {
            console.log("Webview closing");
        }, function error(err) {
            console.log(err);
        });
    }
    handleNextClick(){
        const {currentCategoryIndex, categories,totalcategories} = this.state;
        let index=currentCategoryIndex+1;
        this.setState({
        currentCategoryIndex:index,
        visibleCategory:categories[index]
        });
        if(index === totalcategories)
        {
            this.setState({
                showNext:false,
                showSubmit:true
                });
        }
    }
    handleChange(evt) {
        const {ItemsSelected} = this.state;
        let Items=ItemsSelected;
        if(evt.target.checked)
        {
            Items.push(evt.target.name);
        }
        else
        {
            let index =ItemsSelected.findIndex(evt.target.name);
            if(index !== -1)
            {
                Items.splice(index,1);
            }
        };
        this.setState({ItemsSelected:Items});
      }
    createCheckbox(){
        let category=this.state.visibleCategory;
        let Items = getItems(category);
        return (
            <div>
            {
            Items.map( (element,i) => {
                return ( 
                    <div className="checkbox">                     
                    <label key={category + i}><input type="checkbox" value={element} name={element}
                     onChange={this.handleChange} id={category + i} key={category + i}/>{element}</label>                
                    </div> 
                )
            })}
            </div>
        );
    }

    getCategoryTitle(){
        let category=this.state.visibleCategory;
        let Value = CategoriesTitle.find((prop) => prop.key === category);
        return Value ? Value.value : "";
    }

    render(){
        const {showNext, showSubmit} = this.state;
        return (
            <div className="container">
                <br></br>
                <div className="row pt-20">                    
                    <div className="col-sm-9 col-9">
                        <div className="panel panel-primary">
                            <div className="panel-heading">{this.getCategoryTitle()}</div>
                            <div className="panel-body">
                                <form action="/options/optionspostback" method="get">                    
                                <input type="hidden" name="psid" id="psid" value={this.state.userId}></input>
                                <input type="hidden" name="selectedItems" id="selecteditems" value={this.state.ItemsSelected}></input>
                                <input type="hidden" name="category" id="category"></input>
                                    {this.createCheckbox()}
                                { showNext ? <button type="button" id="nextButton" className="btn btn-primary" onClick={this.handleNextClick}>Next</button> : null}
                                { showSubmit ? <button type="submit" id="submitButton" className="btn btn-primary" onClick={this.handleClick}>Submit</button> : null}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
export default App;
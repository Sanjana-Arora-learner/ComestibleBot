
export const getItems = (category) => {
        let Items=[];
        switch(category)
        {
            case 'BreakfastItems':
                Items.push('Poha','Suji', 'Semiya', 'CornFlakes','Muesli', 'Bread','Butter','Eggs');
                break;
            case 'Pulses':
            Items.push('Toor Dal','Moong Dal', 'Masoor Dal', 'Chana Dal','Rajma', 'Black Chickpeas','Chickpeas','Urad Dal');
            break;
            case 'CookingEssentials':
            Items.push('Rice','Wheat Flour (Atta)','Pasta','Gram Flour','Broken Wheat');
            break;
            case 'CookingOil':
            Items.push('SunFlower Oil','Rice Bran Oil','Sesame Oil','Olive Oil','Mustard Oil','Clarified Butter (Ghee)');
            break;
            case 'Beverages':
            Items.push('Tea','Coffee', 'Green Tea', 'Apple Juice','Mixed Juice');
            break;
            case 'Snacks':
            Items.push('Namkeen','Chips', 'Peanuts', 'Cashews','Walnuts','Almonds');
            break;
            case 'PackagesFoodItems':
            Items.push('Dairy Milk Chocolate','Ice-cream', 'Cookies', 'Jam','Tomato Sauce','Honey');
            break;
            case 'DairyItems':
            Items.push('Cottage Cheese','Milk', 'Cheese', 'Curd');
            break;
            case 'Spices':
            Items.push('Salt','Cumin Seeds', 'Coriander Powder', 'Cumin Powder','Mustard Seeds', 'Turmeric', 'Red Chilly',
                        'Jaggery','Sugar','Dry Red Chilles','Fennel Seeds');
            break;
        }
        return Items;
    }

    export const getAllCategories = () =>
    {
        return ['BreakfastItems','Pulses','CookingEssentials','CookingOil','Beverages','PackagesFoodItems','Snacks','DairyItems','Spices'];
    }
export const CategoriesTitle = [
    { key: 'BreakfastItems', value: 'Please choose your Breakfast Items.' , DisplayName:"Breakfast Items"},
    { key: 'Pulses', value: 'Please choose Pulses.', DisplayName:"Pulses" },
    { key: 'CookingEssentials', value: 'Please choose Cooking Essentials.', DisplayName:"Cooking Essentials" },
    { key: 'CookingOil', value: 'Please choose Cooking Oil.', DisplayName:"Cooking Oil" },
    { key: 'Beverages', value: 'Please choose your Beverages.', DisplayName:"Beverages" },
    { key: 'Snacks', value: 'Please choose your Snacks,', DisplayName:"Snacks" },
    { key: 'PackagesFoodItems', value: 'Please choose any Packaged Food Items.', DisplayName:"Packaged Food Items" },
    { key: 'DairyItems', value: 'Please choose any Dairy Product Items.', DisplayName:"Dairy Products" },
    { key: 'Spices', value: 'Please choose Spices and Condiments.', DisplayName:"Spices" }
    
]
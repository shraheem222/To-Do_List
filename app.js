const express = require("express");
const { getDate, getDay } = require("./date");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const _ = require('lodash')
const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

mongoose.connect("mongodb+srv://username:password@cluster0.igfuu.mongodb.net/To-Do_ListDB");

const itemSchema =new Schema({
  name: {
    type: String,
    required: true,
  },
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to my TO-Do List.",
});
const item2 = new Item({
  name: "Hit the + button to add a new item.",
});
const item3 = new Item({
  name: "<-- Hit these to delete an item.",
});
const defaultItem = [item1, item2, item3];

const ListSchema = new Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", ListSchema);

app.get("/", async (req, res) => {
  try {
    const foundItem = await Item.find({});
    if (foundItem.length === 0) {
      Item.insertMany(defaultItem, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted default items");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItem });
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/", (req, res) => {
  const item = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: item
  });
  if(listName === 'Today'){
    newItem.save();
    res.redirect("/");
  }
  else{
    const findList = async ()=>{
        try {
            const data = await List.findOne({name: listName})
            data.items.push(newItem);
            data.save();
            res.redirect(`/${listName}`)
        } catch (error) {
            console.log(error)
        }
    }
    findList()
  }
});

app.get("/:route", async (req, res) => {
  try {
    const route = _.capitalize(req.params.route);

    const list = new List({
      name: route,
      items: defaultItem,
    });

    const checkroute = await List.findOne({ name: route });
    if (checkroute) {
        // Show an existing list
        return res.render('list', {listTitle: checkroute.name, newListItems: checkroute.items})
    } else {
        // creating new list
        list.save();
        res.redirect(`/${route}`);  
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/delete", async (req, res) => {
  try {
    const id = req.body.checkbox;
    const listName = req.body.list;
    if(listName === 'Today'){
        await Item.deleteOne({ _id: id });
        res.redirect("/");
    }
    else{
        await List.findOneAndRemove({name: listName}, {$pull: {items: {_id: id}}})
        res.redirect(`/${listName}`)
    }
  } catch (error) {
    console.log(error);
  }
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

console.log("end of the file");

import React from "react";

import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import Table from "react-bootstrap/Table";

import Tbody from "./Components/Tbody";
import Thead from "./Components/Thead";
import "./App.css";
import $ from 'jquery';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      doctors: null,
      beginDate: null,
    };
    this.request(this.response);
    this.count = 0;
    this.countPage = 0;
    this.idTimer = 0;
    this.beginWeekDate = 0;
  }

  request = responseFunction => {
    var data = { GUID: window.GUID, Data: { BoardID: window.BoardID } };
    $.ajax({
      data: JSON.stringify(data),
      type: 'POST',
      crossDomain: true,
      url: window.host + window.api,
      success: (res) => { responseFunction(JSON.parse(res)) },
      error: (error) => { console.log("Ошибка! Не могу связаться с API. " + error); }
    });
    
  };

  response = doctors => {
    this.setState({
      doctors: null,
      beginDate: null
    });
    this.groupingDoctors(doctors);
  };


  groupingDoctors = doctors => {
    let categories = {};

    for (let i = 0; i < doctors.length; i++) {
      if (doctors[i].Shedule.length > 0) {
        this.searchMinDate(doctors[i].Shedule[0].Date);
      }

      let nameCategories = Object.keys(categories);
      let doctorsCategories = doctors[i].Doctors.slice();

      for (let j = 0; j < doctorsCategories.length; j++) {
        let category = nameCategories.filter(name => {
          if (name === doctors[i].Doctors[j].DoctName) {
            return name;
          } else {
            return null;
          }
        });
        if (category.length === 0) {
          categories[doctors[i].Doctors[j].DoctName] = [];
          categories[doctors[i].Doctors[j].DoctName].push(doctors[i]);
        } else {
          category.map(elem => {
            categories[elem].push(doctors[i]);
            return null;
          });
        }
      }
    }
    this.setState({
      doctors: categories
    });
  };

  sortCategories = categories => {
    let array = [];
    for (let key in categories) {
      array.push(key);
    }
    for (let i = 0; i < array.length; i++) {
      for (let j = 0; j < array.length - 1; j++) {
        if (categories[array[j]].length > categories[array[j + 1]].length) {
          let temp = array[j + 1];
          array[j + 1] = array[j];
          array[j] = temp;
        }
      }
    }
    return array;
  };

  heightString = (doctor) => {
    let maxRepeat = 1;
    if (window.renderSecondWeek) {
      for (let i = 0; i < doctor.Shedule.length; i++) {
        let countRepeat = 0;
        let date1 = new Date(doctor.Shedule[i].Date)
        for (let j = 0; j < doctor.Shedule.length; j++) {
          let date2 = new Date(doctor.Shedule[j].Date)
          if (date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth()) {
            countRepeat++;
          }
        }
        if (maxRepeat < countRepeat) {
          maxRepeat = countRepeat;
        }
      }
    } else {
      for (let i = 0; i < doctor.Shedule.length; i++) {
        let countRepeat = 0;
        let date1 = new Date(doctor.Shedule[i].Date);
        if (((date1 - this.state.beginDate) / 1000 / 60 / 60 / 24) < 7) {
          for (let j = 0; j < doctor.Shedule.length; j++) {
            let date2 = new Date(doctor.Shedule[j].Date)
            if (date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth()) {
              countRepeat++;
            }
          }
          if (maxRepeat < countRepeat) {
            maxRepeat = countRepeat;
          }
        }
      }
    }

    doctor.height = maxRepeat * window.heightDoctorShedule + window.heightPaddingDoctorShedule;
    return maxRepeat * window.heightDoctorShedule + window.heightPaddingDoctorShedule;
  }

  packDoctors = (categories) => {
    let packs = [];
    let curIndex = 0;
    let curHeight = 0;

    let array = this.sortCategories(categories);
    packs.push([]);
    curHeight = window.heightDate;

    for (let k in array) {
      let key = array[k];
      for (let i = 0; i < categories[key].length; i++) {
        if (packs[curIndex][key]) {
          if (curHeight + this.heightString(categories[key][i]) < window.height) {
            packs[curIndex][key].push(categories[key][i]);
            curHeight += this.heightString(categories[key][i]);
          } else {
            curHeight = window.heightDate + window.heightNameCategory;
            packs.push([]);
            curIndex++;
            packs[curIndex][key] = [];
            packs[curIndex][key].push(categories[key][i]);
            curHeight += this.heightString(categories[key][i]);
          }
        } else {
          if (curHeight + this.heightString(categories[key][i]) + window.heightNameCategory <= window.height) {
            packs[curIndex][key] = [];
            packs[curIndex][key].push(categories[key][i]);
            curHeight += this.heightString(categories[key][i]) + window.heightNameCategory;
          } else {
            packs.push([]);
            curIndex++;
            packs[curIndex][key] = [];
            packs[curIndex][key].push(categories[key][i]);
            curHeight = window.heightDate + window.heightNameCategory;
            curHeight += this.heightString(categories[key][i]);
          }
        }
      }
    }
    this.countPage = packs.length;
    return packs;
  };

  searchMinDate = date => {
    let newDate = new Date(date);
    let beginDate = this.state.beginDate;

    if (beginDate === null || beginDate > newDate) {
      this.beginWeekDate = newDate;
      this.setState({
        beginDate: newDate
      });
    }
  };

  forcedСrutch = array => {
    let crutch = [];

    array.map(item => {
      crutch.push(item);
      crutch.push(item);
      return item;
    });

    return crutch;
  };

  render() {
    if (this.state.doctors !== null) {
      if (window.renderSecondWeek) {
        return (
          <div className={"one-week"}>
            <div class="header-top">
              Расписание приёма врачей
          </div>
            <Carousel
              ref={
                (el) => {
                  let app = this;
                  app.count = 1;
                  let id = setTimeout(function Next() {
                    if (el !== null) {
                      el.next();
                      if (app.count === (app.countPage - 1) * window.countCycles) {
                        app.request(app.response);
                      } else {
                        id = setTimeout(Next, window.displayTime);
                        app.count++;
                      }
                    }
                  }, window.displayTime);
                }
              }
              arrows={false}
              infinite={true}
              responsive={{
                superLargeDesktop: {
                  breakpoint: { max: 4000, min: 3000 },
                  items: 5
                },
                desktop: {
                  breakpoint: { max: 3000, min: 1024 },
                  items: 1
                }
              }}
            >
              {this.forcedСrutch(
                this.packDoctors(this.state.doctors)
              ).map((item, index) => {
                if (index % 2 === 0) {
                  return (
                    <div>
                      <Table bordered>
                        <Thead
                          id={1}
                          beginDate={this.state.beginDate}
                        />
                        <Tbody
                          id={1}
                          beginDate={this.state.beginDate}
                          doctors={item}
                        />
                      </Table>
                    </div>
                  );
                } else {
                  return (
                    <div>
                      <Table bordered>
                        <Thead
                          id={2}
                          beginDate={this.state.beginDate}
                        />
                        <Tbody
                          id={2}
                          beginDate={this.state.beginDate}
                          doctors={item}
                        />
                      </Table>
                    </div>
                  );
                }
              })}
            </Carousel>
          </div>
        );
      } else {
        return (
          <div className={"one-week"}>
            <div class="header-top">
              Расписание приёма врачей
        </div>
            <Carousel
              ref={
                (el) => {
                  let app = this;
                  app.count = 1;
                  var id = setTimeout(function Next() {
                    if (el !== null) {
                      el.next();
                      console.log("beginDate = ", app.beginWeekDate);
                      console.log('Сборка №7');
                      console.log(app.count % app.countPage, "===", app.countPage - 1);
                      console.log(app.count, "===", app.countPage * window.countCycles - 1);
                      console.log(((Date.now() - app.beginWeekDate) / 1000 / 60 / 60 / 24));
                      if (app.count % app.countPage === app.countPage - 1) {
                        console.log("Зашел в проверку");
                        if(app.count === app.countPage * window.countCycles - 1){
                          console.log('Делаю запрос');
                          app.request(app.response);
                        } else if((Date.now() - app.beginWeekDate) / 1000 / 60 / 60 / 24 >= 7){
                          console.log('Делаю запрос(Вермя)');
                          app.request(app.response);
                        }
                        else{
                          id = setTimeout(Next, window.displayTime);
                          app.count++;
                        }
                      } else {
                        id = setTimeout(Next, window.displayTime);
                        app.count++;
                      }
                    }
                  }, window.displayTime);
                }
              }
              arrows={false}
              infinite={true}
              responsive={{
                superLargeDesktop: {
                  breakpoint: { max: 4000, min: 3000 },
                  items: 5
                },
                desktop: {
                  breakpoint: { max: 3000, min: 1024 },
                  items: 1
                }
              }}
            >
              {
                this.packDoctors(this.state.doctors)
                  .map((item) => {
                    return (
                      <div>
                        <Table bordered>
                          <Thead
                            id={1}
                            beginDate={this.state.beginDate}
                          />
                          <Tbody
                            id={1}
                            beginDate={this.state.beginDate}
                            doctors={item}
                          />
                        </Table>
                      </div>
                    );
                  })}
            </Carousel>
          </div >
        );
      }

    } else {
      return null;
    }
  }
}

export default App;

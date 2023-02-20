import axios from 'axios';

export default {
  state: () => ({
    poi: [],
    history: [],
  }),
  actions: {
    updatePoi() {
      return axios.get('/api/v1/poi').then(({ data: { poi } }) => {
        this.poi = poi.map((item) => {
          item.coordinates = JSON.parse(item.coordinates);
          return item;
        });
        return this.poi;
      });
    },
    updateHistory() {
      return axios.get('/api/v1/history').then(({ data: { history } }) => {
        this.history = history.reverse().map((item) => {
          item.ids = JSON.parse(item.ids);
          return item;
        });
        return this.history;
      });
    },
    saveRoute(ids, distance, duration) {
      return axios.post('/api/v1/history', {
        ids: JSON.stringify(ids),
        distance,
        duration
      });
    },
  },
};

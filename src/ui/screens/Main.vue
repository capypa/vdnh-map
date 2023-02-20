<template>
  <div class="vdnh">
    <div
    class="vdnh__map"
    id="map"/>

    <div class="vdnh__content">
      <div>
        <a-button
        @click="removeRoute(); createPoi(allPoi);"
        type="primary"
        style="margin-right: 16px;">
          Показать все POI
        </a-button>

        <a-button
        @click="removeRoute(); removePoi();">
          Очистить карту
        </a-button>
      </div>

      <a-tabs
      v-model="tab"
      @change="tabChangedHandler">
        <a-tab-pane key="static" tab="Статический маршрут">
          <div style="margin-bottom: 16px;">
            <div
            v-for="poi in allPoi"
            :key="poi.id">
              <a-checkbox
              @change="checkStaticPoi(poi.id)"
              :checked="staticPoiIds.includes(poi.id)">
                {{ poi.name }} {{ staticPoiIds.includes(poi.id) ? `(${staticPoiIds.indexOf(poi.id) + 1})` : '' }}
              </a-checkbox>
            </div>
          </div>

          <a-button
          @click="createPoi(staticPoiChecked); createRoute(staticPoiChecked, { save: true }); staticPoiIds = [];"
          :disabled="staticPoiIds.length < 2"
          type="primary">
            Построить маршрут
          </a-button>
        </a-tab-pane>

        <a-tab-pane key="dynamic" tab="Динамический маршрут" force-render>
          <p style="margin-bottom: 8px; font-weight: 500;">
            Выберите начальную точку:
          </p>

          <a-select
          v-model:value="dynamicStartPoiId"
          style="width: 280px; margin-bottom: 24px;">
            <a-select-option
            v-for="poi in allPoi"
            :key="poi.id"
            :value="poi.id">
              {{ poi.name }}
            </a-select-option>
          </a-select>

          <p style="margin-bottom: 8px; font-weight: 500;">
            Выберите обязательную точку маршрута:
          </p>

          <a-select
          v-model:value="dynamicRequiredPoiId"
          style="width: 280px; margin-bottom: 24px;">
            <a-select-option :value="null">Не выбрано</a-select-option>
            <a-select-option
            v-for="poi in allPoi"
            :key="poi.id"
            :value="poi.id">
              {{ poi.name }}
            </a-select-option>
          </a-select>

          <p style="margin-bottom: 8px; font-weight: 500;">
            Выберите ограничение по времени:
          </p>

          <a-select
          v-model:value="dynamicTimeRestriction"
          style="width: 280px; margin-bottom: 24px;">
            <a-select-option :value="null">Не выбрано</a-select-option>
            <a-select-option :value="900">До 15 минут</a-select-option>
            <a-select-option :value="1800">От 15 до 30 минут</a-select-option>
            <a-select-option :value="3600">От 30 до 60 минут</a-select-option>
            <a-select-option :value="7200">От 60 минут</a-select-option>
          </a-select>

          <div>
            <a-button
            @click="generateRoute"
            :loading="dynamicButtonLoader"
            type="primary">
              Сгенерировать маршрут
            </a-button>
          </div>
        </a-tab-pane>

        <a-tab-pane key="history" tab="История маршрутов">
          <div>
            <div
            v-for="story in historyRoutes"
            :key="story.id"
            style="margin-bottom: 24px;">
              <p style="font-weight: 500; margin-bottom: 0px;">
                Маршрут {{ story.id }}
              </p>

              <p
              v-for="poi in getPoiByIds(story.ids)"
              :key="poi.id"
              style="font-size: 13px; color: #4f4f4f; margin: 0;">
                {{ poi.name }}
              </p>

              <p
              style="font-size: 13px; color: #4f4f4f; margin: 0;">
                {{ `${story.distance} (${story.duration})` }}
              </p>

              <a-button
              @click="createPoi(getPoiByIds(story.ids)); createRoute(getPoiByIds(story.ids));"
              type="primary"
              style="margin-top: 8px;">
                Показать маршрут
              </a-button>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script>
  import { defineStore } from 'pinia';

  import poiStore from 'stores/poi';

  export default {
    name: 'VdnhScreen',
    setup() {
      const poiManager = defineStore(`poiStore`, poiStore)();

      return { poiManager };
    },
    created() {
      this.ymaps.ready(async () => {
        this.createMap();

        this.poiManager.updatePoi().then(() => {
          this.createPoi(this.allPoi);

          this.dynamicStartPoiId = this.allPoi.find((item) => item.name === 'Павильон №1').id;
        });
      });
    },
    methods: {
      createMap() {
        this.map = new this.ymaps.Map('map', {
          center: [37.627214, 55.832648],
          zoom: 15,
        });
      },
      createPoi(poi) {
        this.removePoi();

        const objects = new this.ymaps.GeoObjectCollection();

        poi.forEach((item) => {
          objects.add(new this.ymaps.Placemark(item.coordinates, {
            iconCaption: item.name,
          }));
        });

        this.map.geoObjects.add(objects);
        this.currentObjects = objects;
      },
      removePoi() {
        if (this.currentObjects) {
          this.map.geoObjects.remove(this.currentObjects);
          this.currentObjects = null;
        }
      },
      createRoute(poi, save = false) {
        this.removeRoute();

        const route = new this.ymaps.multiRouter.MultiRoute({
          referencePoints: poi.map((item) => {
            return item.coordinates;
          }),
          params: {
            routingMode: 'pedestrian',
          },
        });

        route.model.events.add('requestsuccess', () => {
          const distance = route.getActiveRoute().properties.get('distance').text;
          const duration = route.getActiveRoute().properties.get('duration').text;

          if (save) {
            this.saveRoute(poi, distance, duration);
          }
        });

        this.map.geoObjects.add(route);
        this.currentRoute = route;
      },
      saveRoute(poi, distance, duration) {
        this.poiManager.saveRoute(poi.map((item) => {
          return item.id;
        }), distance, duration);
      },
      removeRoute() {
        if (this.currentRoute) {
          this.map.geoObjects.remove(this.currentRoute);
          this.currentRoute = null;
        }
      },
      // ---
      generateRoute() {
        this.dynamicButtonLoader = true;

        const poiIds = [this.dynamicStartPoiId];

        const poiCount = {
          900: 3,
          1800: Math.floor(Math.random() * (4 - 3 + 1) + 3),
          3600: Math.floor(Math.random() * (6 - 4 + 1) + 4),
          7200: Math.floor(Math.random() * (7 - 5 + 1) + 5),
        }[this.dynamicTimeRestriction] || Math.floor(Math.random() * (7 - 3 + 1) + 3);

        while(poiIds.length < poiCount) {
          const randomPoiId = Math.floor(Math.random() * (this.allPoi.length - 3 + 1) + 1);
          if (!poiIds.includes(randomPoiId)) {
            poiIds.push(randomPoiId);
          }
        }

        if (this.dynamicRequiredPoiId && !poiIds.includes(this.dynamicRequiredPoiId)) {
          poiIds.splice(Math.floor(Math.random() * (poiIds.length - 1) + 1), 1, this.dynamicRequiredPoiId);
        }

        const route = new this.ymaps.multiRouter.MultiRoute({
          referencePoints: this.getPoiByIds(poiIds).map((item) => {
            return item.coordinates;
          }),
          params: {
            routingMode: 'pedestrian',
          },
        });

        route.model.events.add('requestsuccess', () => {
          const duration = route.getActiveRoute().properties.get('duration').value;

          if (this.dynamicTimeRestriction && (duration > this.dynamicTimeRestriction || duration < this.dynamicTimeRestriction / 2)) {
            this.generateRoute();
            return;
          } else {
            this.createPoi(this.getPoiByIds(poiIds));
            this.createRoute(this.getPoiByIds(poiIds), { save: true});

            this.dynamicButtonLoader = false;
          }
        });
      },
      // ---
      checkStaticPoi(id) {
        if (this.staticPoiIds.includes(id)) {
          this.staticPoiIds.splice(this.staticPoiIds.indexOf(id), 1);
          return;
        }
        this.staticPoiIds.push(id);
      },
      getPoiByIds(ids) {
        return ids.map((id) => {
          return this.allPoi.find((item) => {
            return id === item.id;
          });
        });
      },
      tabChangedHandler(tab) {
        if (tab === 'history') {
          this.poiManager.updateHistory();
        }
      },
    },
    computed: {
      allPoi() {
        return this.poiManager.poi;
      },
      staticPoiChecked() {
        return this.allPoi.filter((item) => {
          return this.staticPoiIds.includes(item.id);
        });
      },
      historyRoutes() {
        return this.poiManager.history;
      },
    },
    data: () => ({
      tab: 'static',
      staticPoiIds: [],
      dynamicStartPoiId: 25,
      dynamicRequiredPoiId: null,
      dynamicTimeRestriction: null,
      dynamicButtonLoader: false,
    }),
  };
</script>

<style lang="scss">

  .vdnh {
    display: flex;
    flex-flow: row nowrap;
    flex-grow: 1;
  }

  .vdnh__map {
    display: flex;
    flex-flow: column nowrap;
    flex: 1 0 100px;
  }

  .vdnh__content {
    display: flex;
    flex-flow: column nowrap;
    flex: 1 0 100px;
    padding: 16px;
  }

  .ant-tabs-content-holder {
    overflow: auto;
  }
</style>

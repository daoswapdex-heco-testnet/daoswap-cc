import Vue from "vue";
import VueRouter from "vue-router";
// import Home from "../views/Home.vue";
import CrowdsaleForAngel from "../views/CrowdsaleForAngel.vue";
import CrowdsaleForRetail from "../views/CrowdsaleForRetail.vue";
import About from "../views/About.vue";
import News from "../views/News.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    // component: Home
    component: () => import("@/layouts/home/Index.vue"),
    children: [
      {
        path: "",
        name: "Home",
        component: () => import("@/views/home/Index.vue")
      },
      {
        path: "/angel",
        name: "Angel",
        component: CrowdsaleForAngel
      },
      {
        path: "/stake",
        name: "Stake",
        component: CrowdsaleForRetail
      },
      // {
      //   path: "/pe",
      //   name: "PE",
      //   component: CrowdsaleForRetail
      // },
      {
        path: "/about",
        name: "About",
        component: About
      },
      {
        path: "/news",
        name: "News",
        component: News
      }
      // {
      //   path: "pro",
      //   name: "Pro",
      //   component: () => import("@/views/pro/Index.vue"),
      //   meta: { src: require("@/assets/pro.jpg") }
      // }
    ]
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  scrollBehavior: (to, from, savedPosition) => {
    if (to.hash) return { selector: to.hash };
    if (savedPosition) return savedPosition;

    return { x: 0, y: 0 };
  },
  routes
});

export default router;

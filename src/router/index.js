import Vue from "vue";
import VueRouter from "vue-router";
import CrowdsaleForRetail from "../views/CrowdsaleForRetail.vue";
import CrowdsaleForRetail2 from "../views/CrowdsaleForRetail2.vue";
import CrowdsaleForRetailEnd from "../views/CrowdsaleForRetailEnd.vue";
import AirdropToRelationship from "../views/AirdropToRelationship.vue";
import AirdropForStake from "../views/AirdropForStake.vue";
import AirdropForHoldDAO from "../views/AirdropForHoldDAO.vue";
import BurnForging from "../views/chn/BurnForging.vue";
import BurnForgingHistory from "../views/chn/BurnForgingHistory.vue";
import ComputingPowerMining from "../views/chn/ComputingPowerMining.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    component: () => import("@/layouts/home/Index.vue"),
    children: [
      {
        path: "",
        name: "Home",
        component: () => import("@/views/home/Index.vue")
      },
      {
        path: "/stake",
        name: "Stake",
        redirect: "/stake/period-2",
        component: () => import("@/layouts/home/View.vue"),
        children: [
          {
            path: "/stake/end",
            name: "StakeEnd",
            component: CrowdsaleForRetailEnd
          },
          {
            path: "/stake/period-1",
            name: "StakePeriod1",
            component: CrowdsaleForRetail
          },
          {
            path: "/stake/period-2",
            name: "StakePeriod2",
            component: CrowdsaleForRetail2
          }
        ]
      },
      {
        path: "/airdrop",
        name: "Airdrop",
        component: AirdropForStake
      },
      {
        path: "/airdrop-holder",
        name: "AirdropHolder",
        component: AirdropForHoldDAO
      },
      {
        path: "/chn",
        name: "CHN",
        redirect: "/chn/node",
        component: () => import("@/layouts/home/View.vue"),
        children: [
          {
            path: "/chn/node",
            name: "CHNNode",
            component: BurnForging
          },
          {
            path: "/chn/forging/history",
            name: "BurnForgingHistory",
            component: BurnForgingHistory
          },
          {
            path: "/chn/power/mining",
            name: "ComputingPowerMining",
            component: ComputingPowerMining
          }
        ]
      },
      {
        path: "/invite",
        name: "Invite",
        component: AirdropToRelationship
      },
      {
        path: "*",
        redirect: "/"
      }
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

import Vue from "vue";
import VueRouter from "vue-router";
import CrowdsaleForRetail from "../views/crowdsale/CrowdsaleForRetail.vue";
import CrowdsaleForRetail2 from "../views/crowdsale/CrowdsaleForRetail2.vue";
import CrowdsaleForRetailEnd from "../views/crowdsale/CrowdsaleForRetailEnd.vue";
import AirdropToRelationship from "../views/airdrop/AirdropToRelationship.vue";
import AirdropForSwapsSnapshot from "../views/airdrop/AirdropForSwapsSnapshot.vue";
import BurnForging from "../views/chn/BurnForging.vue";
import BurnForgingHistory from "../views/chn/BurnForgingHistory.vue";
import ComputingPowerMiningForLiquidity from "../views/chn/ComputingPowerMiningForLiquidity.vue";
import ComputingPowerMiningForLiquidityCreation from "../views/chn/ComputingPowerMiningForLiquidityCreation.vue";
import CrowdsaleForRetailUnlimited from "../views/crowdsale/crowdsaleForRetailUnlimited/CrowdsaleForRetailUnlimited.vue";
import CrowdsaleForRetailUnlimitedHistory from "../views/crowdsale/crowdsaleForRetailUnlimited/CrowdsaleForRetailUnlimitedHistory.vue";

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
        component: () => import("@/layouts/home/ViewBlank.vue"),
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
        path: "/stake-dst",
        name: "StakeDST",
        redirect: "/stake-dst/stake",
        component: () => import("@/layouts/home/ViewBlank.vue"),
        children: [
          {
            path: "/stake-dst/stake",
            name: "CrowdsaleForRetailUnlimited",
            component: CrowdsaleForRetailUnlimited
          },
          {
            path: "/stake-dst/history",
            name: "CrowdsaleForRetailUnlimitedHistory",
            component: CrowdsaleForRetailUnlimitedHistory
          }
        ]
      },
      {
        path: "/airdrop",
        name: "Airdrop",
        component: AirdropForSwapsSnapshot
      },
      {
        path: "/chn",
        name: "CHN",
        redirect: "/chn/node",
        component: () => import("@/layouts/home/ViewBlank.vue"),
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
          }
        ]
      },
      {
        path: "/hash-mining",
        name: "Hash Mining",
        component: ComputingPowerMiningForLiquidity
      },
      {
        path: "/competition-mining",
        name: "Competition Mining",
        component: ComputingPowerMiningForLiquidityCreation
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

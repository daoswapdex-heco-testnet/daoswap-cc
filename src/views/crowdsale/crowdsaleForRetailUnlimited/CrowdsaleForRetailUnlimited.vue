<template>
  <div class="fill-height">
    <v-container v-if="web3 && connected" class="fill-height">
      <v-row justify="center">
        <v-col md="6">
          <!-- 认购操作 -->
          <v-card class="fill-width">
            <v-card outlined>
              <v-card-title>
                <v-avatar size="24" class="mr-2">
                  <img :src="require('@/assets/logo.png')" alt="DST" />
                </v-avatar>
                <span class="title font-weight-bold text-h5">
                  {{ $t("DST Stake") }}
                </span>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <v-row align="center">
                  <v-col class="body-4" cols="12">
                    <p>
                      {{ $t("DST Staked Total Amount") }}：
                      {{ dataForCrowdsale.tokenTotalAmount }}
                      {{ dataForCrowdsale.tokenSymbol }}
                    </p>
                    <p>
                      {{ $t("DST Stakeable Amount") }}：
                      {{ accountAssets.balance }}
                      {{ dataForCrowdsale.tokenSymbol }}
                    </p>
                  </v-col>
                </v-row>
              </v-card-text>
              <v-divider></v-divider>
              <v-card-actions class="justify-center">
                <v-btn
                  large
                  color="#93B954"
                  dark
                  width="80%"
                  @click="
                    accountAssets.allowanceAmount &&
                    accountAssets.allowanceAmount >= accountAssets.balance
                      ? handleCrowdsale()
                      : handleApprove()
                  "
                  :disabled="accountAssets.balance <= 0"
                >
                  {{
                    accountAssets.allowanceAmount &&
                    accountAssets.allowanceAmount >= accountAssets.balance
                      ? $t("Stake")
                      : $t("Approve")
                  }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-card>
          <!-- 其它操作 -->
          <v-card justify="center" class="fill-width mt-10">
            <v-card-title>
              <span class="title font-weight-bold text-h5">
                {{ $t("DST Staked History") }}
              </span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-card-actions class="justify-center">
                <v-btn
                  large
                  width="80%"
                  outlined
                  color="#93B954"
                  @click="gotoHistory"
                >
                  {{ $t("DST Staked History") }}
                </v-btn>
              </v-card-actions>
            </v-card-text>
          </v-card>
          <!-- 当前钱包账号 -->
          <v-card justify="center" class="fill-width mt-10">
            <v-card-title>
              <span class="title font-weight-bold text-h5">
                {{ $t("Current Token Address") }}
              </span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-row align="center">
                <v-col
                  class="body-1"
                  cols="12"
                  @click="handleCopy(address, $event)"
                >
                  <p>
                    {{ address }}
                    <v-icon>mdi-content-copy</v-icon>
                  </p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
          <!-- 官方说明 -->
          <v-card justify="center" class="fill-width mt-10">
            <v-card-text>
              <v-row align="center">
                <v-col class="body-1" cols="12">
                  <p @click="handleCopy(DAOAddress, $event)">
                    DAO contract: {{ DAOAddress }}
                    <v-icon>mdi-content-copy</v-icon>
                  </p>
                  <p @click="handleCopy(DSTAddress, $event)">
                    DST contract: {{ DSTAddress }}
                    <v-icon>mdi-content-copy</v-icon>
                  </p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
          <!-- 遮罩层 -->
          <v-overlay z-index="9999" opacity="0.7" :value="loading">
            <v-progress-circular indeterminate size="64"></v-progress-circular>
          </v-overlay>
          <!-- 提示层 -->
          <v-snackbar
            v-model="operationResult.snackbar"
            :color="operationResult.color"
            centered
            top
            timeout="4000"
          >
            {{ $t(operationResult.text) }}
          </v-snackbar>
        </v-col>
      </v-row>
    </v-container>
    <v-container v-else>
      <v-row justify="center">
        <v-col md="6">
          <v-card justify="center" class="fill-width">
            <v-card-actions class="justify-center">
              <!-- 连接钱包 -->
              <v-btn
                class="mr-2"
                v-if="!connected"
                color="#93B954"
                block
                @click="onConnect"
              >
                {{ $t("Connect Wallet") }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import clip from "@/utils/clipboard";
import {
  DAOAddress,
  DSTAddress,
  CrowdsaleForRetailUnlimitedContractAddress
} from "@/constants";
import { getContract, weiToEther, etherToWei } from "@/utils/web3";
// 引入合约 ABI 文件
import ERC20DST from "@/constants/contractJson/ERC20DST.json";
import CrowdsaleForRetailUnlimited from "@/constants/contractJson/CrowdsaleForRetailUnlimited.json";

export default {
  name: "CrowdsaleForRetailUnlimited",
  data: () => ({
    loading: false,
    DAOAddress,
    DSTAddress,
    // 众筹信息
    dataForCrowdsale: {
      tokenSymbol: null,
      tokenTotalAmount: 0
    },
    // 当前账户相关信息
    accountAssets: {
      allowanceAmount: 0, // 已授权额度
      balance: 0 // 余额
    },
    // 提示框
    operationResult: {
      color: "success",
      snackbar: false,
      text: `Hello`
    }
  }),
  created() {
    if (this.web3 && this.connected) {
      this.getAccountAssets();
    } else {
      this.onConnect();
    }
  },
  watch: {
    web3(web3) {
      if (web3) {
        this.getAccountAssets();
      }
    },
    address(address) {
      if (address) {
        this.getAccountAssets();
      }
    }
  },
  computed: {
    connected() {
      return this.$store.state.web3.connected;
    },
    web3() {
      return this.$store.state.web3.web3;
    },
    address() {
      return this.$store.state.web3.address;
    }
  },
  methods: {
    // 连接钱包 OK
    onConnect() {
      this.$store.dispatch("web3/connect");
    },
    // 断开连接钱包 OK
    closeWallet() {
      this.$store.dispatch("web3/closeWallet");
    },
    // 复制地址
    handleCopy(text, event) {
      clip(text, event);
      this.operationResult.color = "success";
      this.operationResult.snackbar = true;
      this.operationResult.text = "Cope Success";
    },
    // 获取账号信息
    async getAccountAssets() {
      this.loading = true;
      try {
        // 查询当前账号余额
        const contract = getContract(ERC20DST, DSTAddress, this.web3);
        this.dataForCrowdsale.tokenSymbol = await contract.methods
          .symbol()
          .call();
        const balance = await contract.methods.balanceOf(this.address).call();
        const allowance = await contract.methods
          .allowance(this.address, CrowdsaleForRetailUnlimitedContractAddress)
          .call();
        this.accountAssets.balance = weiToEther(balance, this.web3);
        this.accountAssets.allowanceAmount = weiToEther(allowance, this.web3);
        // 查询质押合约信息
        await this.getCrowdsaleInfo();
      } catch (error) {
        console.info(error);
      }
      this.loading = false;
    },
    // 获取众筹信息
    async getCrowdsaleInfo() {
      this.loading = true;
      try {
        const contract = getContract(
          CrowdsaleForRetailUnlimited,
          CrowdsaleForRetailUnlimitedContractAddress,
          this.web3
        );
        const tokenVestingInfo = await contract.methods
          .tokenVestingList(this.address)
          .call();
        this.dataForCrowdsale.tokenTotalAmount = weiToEther(
          tokenVestingInfo.tokenTotalAmount,
          this.web3
        );
      } catch (error) {
        console.info(error);
      }
      this.loading = false;
    },
    // 授权
    handleApprove() {
      this.loading = true;
      // 执行合约
      getContract(ERC20DST, DSTAddress, this.web3)
        .methods.approve(
          CrowdsaleForRetailUnlimitedContractAddress,
          etherToWei(this.accountAssets.balance, this.web3)
        )
        .send({ from: this.address })
        .then(() => {
          this.loading = false;
          this.operationResult.color = "success";
          this.operationResult.snackbar = true;
          this.operationResult.text = "Approve Success";
          this.getAccountAssets();
        })
        .catch(e => {
          this.loading = false;
          console.info(e);
        });
    },
    // 认购
    handleCrowdsale() {
      this.loading = true;
      // 执行合约
      getContract(
        CrowdsaleForRetailUnlimited,
        CrowdsaleForRetailUnlimitedContractAddress,
        this.web3
      )
        .methods.buyTokens(etherToWei(this.accountAssets.balance, this.web3))
        .send({ from: this.address })
        .then(() => {
          this.loading = false;
          this.operationResult.color = "success";
          this.operationResult.snackbar = true;
          this.operationResult.text = "DST Staked Success";
          this.getAccountAssets();
        })
        .catch(e => {
          this.loading = false;
          console.info(e);
        });
    },
    // 跳转历史记录
    gotoHistory() {
      this.$router.push({ path: "/stake-dst/history" });
    }
  }
};
</script>

<style lang="sass">
.theme--dark.v-btn.v-btn--disabled.v-btn--has-bg
  background-color: rgb(147, 185, 84) !important
  border-color: rgb(147, 185, 84) !important
  opacity: 0.5 !important

.v-btn--disabled
  background-color: rgb(147, 185, 84)
  border-color: rgb(147, 185, 84)
  opacity: 0.5
</style>

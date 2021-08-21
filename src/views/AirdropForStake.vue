<template>
  <div class="fill-height">
    <v-container v-if="web3 && connected" class="fill-height">
      <v-row justify="center">
        <v-col md="6">
          <!-- 领取操作 -->
          <v-card class="fill-width">
            <v-card outlined>
              <v-card-title>
                <v-avatar size="24" class="mr-2">
                  <img :src="require('@/assets/logo.png')" alt="DAO" />
                </v-avatar>
                <span class="title font-weight-light">
                  {{ $t("AirdropForStake") }}
                </span>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <!-- 可领取 -->
                <v-row
                  align="center"
                  v-if="
                    accountAssets.airdropAmount <= 0 &&
                      accountAssets.enableAirdrop
                  "
                >
                  <v-col class="display-3" cols="12">
                    <v-card-title>
                      <span class="headline">{{
                        $t("Available airdrop amount")
                      }}</span>
                    </v-card-title>
                    <v-card-text>
                      <v-row align="center">
                        <v-col class="display-3" cols="12">
                          {{ accountAssets.actualAirdropAmount }}
                          <span class="display-1">
                            DAO
                          </span>
                        </v-col>
                      </v-row>
                    </v-card-text>
                    <v-card-actions class="justify-center">
                      <v-btn
                        large
                        color="#93B954"
                        dark
                        width="80%"
                        @click="handleReceiveAirdrop()"
                      >
                        {{ $t("ReceiveAirdrop") }}
                      </v-btn>
                    </v-card-actions>
                  </v-col>
                </v-row>
                <!-- 已经领取 -->
                <v-row
                  align="center"
                  v-else-if="
                    accountAssets.airdropAmount > 0 &&
                      accountAssets.enableAirdrop
                  "
                >
                  <v-col class="display-3" cols="12">
                    <v-card-title>
                      <span class="headline">{{ $t("Received amount") }}</span>
                    </v-card-title>
                    <v-card-text>
                      <v-row align="center">
                        <v-col class="display-3" cols="12">
                          {{ accountAssets.airdropAmount }}
                          <span class="display-1">
                            DAO
                          </span>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-col>
                </v-row>
                <!-- 不能领取 -->
                <v-row align="center" v-else>
                  <v-col class="display-3" cols="12">
                    <v-card-text>
                      <v-row align="center">
                        <v-col class="display-3" cols="12">
                          {{ $t("You can't claim the airdrop") }}
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-card>
          <!-- 当前钱包账号 -->
          <v-card justify="center" class="fill-width mt-10">
            <v-card-title>
              <span class="title font-weight-light">
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
          <!-- 认购数据显示 -->
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
import { AirdropForStakeContractAddress } from "@/constants";
import { getContract, weiToEther } from "@/utils/web3";
// 引入合约 ABI 文件
import AirdropForStake from "@/constants/contractJson/AirdropForStake.json";

export default {
  name: "AirdropForStake",
  data: () => ({
    loading: false,
    // 当前账户相关信息
    accountAssets: {
      actualAirdropAmount: 0, // 可领取DAO金额
      airdropAmount: 0, // 已领取DAO金额
      enableAirdrop: false
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
  computed: {
    connected() {
      return this.$store.state.web3.connected;
    },
    web3() {
      return this.$store.state.web3.web3;
    },
    address() {
      this.getAccountAssets();
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
        const web3 = await this.web3;
        const contract = getContract(
          AirdropForStake,
          AirdropForStakeContractAddress,
          web3
        );
        // 查询是否可以领取空投
        this.accountAssets.enableAirdrop = await contract.methods
          .checkDatStake(this.address)
          .call();
        if (this.accountAssets.enableAirdrop) {
          // 获取可领取DAO金额
          const actualAirdropAmount = await contract.methods
            .getActualAirdropAmount(this.address)
            .call();
          this.accountAssets.actualAirdropAmount = weiToEther(
            actualAirdropAmount,
            web3
          );
        }
        // 获取已领取DAO空投金额
        const airdropAmount = await contract.methods
          .airdropAmount(this.address)
          .call();
        this.accountAssets.airdropAmount = weiToEther(airdropAmount, web3);
      } catch (error) {
        console.info(error);
      }
      this.loading = false;
    },
    // 领取空投
    handleReceiveAirdrop() {
      this.loading = true;
      // 执行合约
      getContract(AirdropForStake, AirdropForStakeContractAddress, this.web3)
        .methods.receiveAirdrop()
        .send({ from: this.address })
        .then(() => {
          this.loading = false;
          this.operationResult.snackbar = true;
          this.operationResult.text = "Crowdsale Success";
          this.getAccountAssets();
        })
        .catch(e => {
          this.loading = false;
          console.info(e);
        });
    }
  }
};
</script>

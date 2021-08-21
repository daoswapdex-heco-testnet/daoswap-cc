<template>
  <div class="fill-height">
    <v-container v-if="connected" class="fill-height">
      <v-row justify="center">
        <v-col md="6">
          <!-- 认购操作 -->
          <v-card class="fill-width mt-10">
            <v-card outlined v-if="dataForCrowdsale.joinedAmount <= 0">
              <v-card-title>
                <v-avatar size="24" class="mr-2">
                  <img :src="require('@/assets/logo.png')" alt="DAO" />
                </v-avatar>
                <span class="title font-weight-light">
                  {{ $t("DAO Amount") }}
                </span>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text justify="center">
                <v-row align="center">
                  <v-col class="display-1" cols="12">
                    {{ $t("The current user is not involved") }}
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
            <v-card outlined v-if="dataForCrowdsale.joinedAmount > 0">
              <v-card-title>
                <v-avatar size="24" class="mr-2">
                  <img :src="require('@/assets/logo.png')" alt="DAO" />
                </v-avatar>
                <span class="title font-weight-light">
                  {{ $t("DAO Amount") }}
                </span>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <v-row align="center">
                  <v-col class="display-3" cols="12">
                    {{ dataForCrowdsale.joinedAmount }}
                    <span class="display-1">
                      {{ dataForCrowdsale.tokenSymbol }}
                    </span>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-card>
          <!-- 分期释放操作 -->
          <v-card
            class="fill-width mt-10"
            v-if="dataForCrowdsale.tokenVestingAddress"
          >
            <v-card outlined>
              <v-card-title>
                <span class="title font-weight-light">
                  {{ $t("TokenVesting Info") }}
                </span>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <v-row align="center">
                  <v-col class="body-1" cols="12">
                    <p>
                      {{ $t("Beneficiary") }}：
                      {{ dataForTokenVesting.beneficiary }}
                    </p>
                    <p>
                      {{ $t("Balance") }}：
                      {{ dataForTokenVesting.balance }}
                      {{ dataForTokenVesting.tokenSymbol }}
                    </p>
                    <p>
                      {{ $t("Released") }}：
                      {{ dataForTokenVesting.released }}
                      {{ dataForTokenVesting.tokenSymbol }}
                    </p>
                    <p>
                      {{ $t("Start") }}：
                      {{ dataForTokenVesting.start }}
                    </p>
                    <p>
                      {{ $t("Duration") }}：
                      {{ dataForTokenVesting.duration }}
                    </p>
                    <p>
                      {{ $t("ReleasableAmount") }}：
                      {{ dataForTokenVesting.releasableAmount }}
                      {{ dataForTokenVesting.tokenSymbol }}
                    </p>
                  </v-col>
                </v-row>
              </v-card-text>
              <v-divider
                v-if="dataForTokenVesting.releasableAmount > 0"
              ></v-divider>
              <v-card-actions
                class="justify-center"
                v-if="dataForTokenVesting.releasableAmount > 0"
              >
                <v-btn
                  large
                  color="#93B954"
                  dark
                  width="80%"
                  @click="handleRelease()"
                >
                  {{ $t("Claim") }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-card>
          <!-- 当前钱包账号 -->
          <!-- <v-card justify="center" class="fill-width mt-10">
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
          </v-card> -->
          <!-- 遮罩层 -->
          <v-overlay z-index="9999" opacity="0.7" :value="loading">
            <v-progress-circular indeterminate size="64"></v-progress-circular>
          </v-overlay>
          <!-- 提示层 -->
          <v-snackbar
            v-model="operationResult.snackbar"
            color="success"
            centered
            timeout="4000"
          >
            {{ $t(operationResult.text) }}
          </v-snackbar>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import clip from "@/utils/clipboard";
import { parseTime, formatSeconds } from "@/utils/utilities";
import {
  CrowdsaleForAngelContractAddress,
  DAOAddress,
  ZeroAddress
} from "@/constants";
import { getContract, weiToEther } from "@/utils/web3";
// 引入合约 ABI 文件
import CrowdsaleForAngel from "@/constants/contractJson/CrowdsaleForAngel.json";
import ERC20DAO from "@/constants/contractJson/ERC20DAO.json";
import TokenVestingAngel from "@/constants/contractJson/TokenVestingAngel.json";

export default {
  name: "CrowdsaleForAngel",
  data: () => ({
    loading: false,
    // 众筹信息
    dataForCrowdsale: {
      joinedAmount: 0,
      tokenVestingAddress: null
    },
    // 分期释放信息
    dataForTokenVesting: {
      tokenSymbol: null,
      beneficiary: null,
      balance: 0,
      released: 0,
      start: null,
      duration: null,
      releasableAmount: 0
    },
    // 当前账户相关信息
    accountAssets: {
      allowanceAmount: 0, // 已授权额度
      balance: 0 // 余额
    },
    // 提示框
    operationResult: {
      snackbar: false,
      text: `Hello`
    }
  }),
  created() {
    this.getCrowdsaleInfo();
  },
  computed: {
    connected() {
      return this.$store.state.web3.connected;
    },
    web3() {
      return this.$store.state.web3.web3;
    },
    address() {
      this.getCrowdsaleInfo();
      return this.$store.state.web3.address;
    }
  },
  methods: {
    // 复制地址
    handleCopy(text, event) {
      clip(text, event);
    },
    // 获取众筹信息
    async getCrowdsaleInfo() {
      this.loading = true;
      try {
        const web3 = await this.web3;
        const contract = getContract(
          CrowdsaleForAngel,
          CrowdsaleForAngelContractAddress,
          web3
        );
        const joinedAmount = await contract.methods.joined(this.address).call();
        this.dataForCrowdsale.joinedAmount = weiToEther(joinedAmount, web3);
        // 获取分期释放合约地址
        this.dataForCrowdsale.tokenVestingAddress = null;
        const TokenVestingInfo = await contract.methods
          .TokenVestingInfoByBeneficiaryToken(this.address)
          .call();
        if (TokenVestingInfo.tokenVesting != ZeroAddress) {
          this.dataForCrowdsale.tokenVestingAddress =
            TokenVestingInfo.tokenVesting;
        }
        await this.getTokenVestingInfo();
      } catch (error) {
        console.info(error);
      }
      this.loading = false;
    },
    // 获取分期释放信息
    async getTokenVestingInfo() {
      if (this.dataForCrowdsale.tokenVestingAddress) {
        const web3 = await this.web3;
        this.loading = true;
        try {
          // 获取分期释放合约余额
          const contractERC20 = await getContract(ERC20DAO, DAOAddress, web3);
          this.dataForTokenVesting.tokenSymbol = await contractERC20.methods
            .symbol()
            .call();
          const balance = await contractERC20.methods
            .balanceOf(this.dataForCrowdsale.tokenVestingAddress)
            .call();
          this.dataForTokenVesting.balance = weiToEther(balance, web3);
          // 获取分期释放合约信息
          const contract = await getContract(
            TokenVestingAngel,
            this.dataForCrowdsale.tokenVestingAddress,
            web3
          );
          this.dataForTokenVesting.beneficiary = await contract.methods
            .beneficiary()
            .call();
          const released = await contract.methods.released(DAOAddress).call();
          this.dataForTokenVesting.released = weiToEther(released, web3);
          const start = await contract.methods.start().call();
          this.dataForTokenVesting.start = parseTime(
            start,
            "{y}-{m}-{d} {h}:{i}:{s}"
          );
          const duration = await contract.methods.duration().call();
          this.dataForTokenVesting.duration = formatSeconds(duration);
          const releasableAmount = await contract.methods
            .releasableAmount(DAOAddress)
            .call();
          this.dataForTokenVesting.releasableAmount = weiToEther(
            releasableAmount,
            web3
          );
        } catch (error) {
          console.info(error);
        }
        this.loading = false;
      }
    },
    // 提取DAO
    handleRelease() {
      this.loading = true;
      // 执行合约
      getContract(
        TokenVestingAngel,
        this.dataForCrowdsale.tokenVestingAddress,
        this.web3
      )
        .methods.release(DAOAddress)
        .send({ from: this.address })
        .then(() => {
          this.loading = false;
          this.operationResult.snackbar = true;
          this.operationResult.text = "Claim Success";
          this.getCrowdsaleInfo();
        })
        .catch(e => {
          this.loading = false;
          console.info(e);
        });
    }
  }
};
</script>

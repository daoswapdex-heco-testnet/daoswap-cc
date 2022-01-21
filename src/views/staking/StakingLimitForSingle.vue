<template>
  <div class="fill-height">
    <v-container v-if="web3 && connected" class="fill-height">
      <v-row justify="center">
        <v-col md="6">
          <!-- 数据显示 -->
          <v-card justify="center" class="fill-width">
            <v-card-title>
              <span class="title font-weight-bold text-h5">
                {{ $t("Staking Status") }}
              </span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-row align="center">
                <v-col class="body-1" cols="12">
                  <p>
                    {{ $t("Staking Total Amount") }}：{{
                      accountAssets.stakedAmount
                    }}
                    {{ tokenSymbol }}
                  </p>
                  <p>
                    {{ $t("Staking Enable Amount") }}：{{ maxStakingAmount }}
                    {{ tokenSymbol }}
                  </p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
          <!-- 操作 -->
          <v-card class="fill-width mt-10">
            <v-card outlined>
              <v-card-title>
                <v-avatar size="24" class="mr-2">
                  <img :src="require('@/assets/logo.png')" alt="DAO" />
                </v-avatar>
                <span class="title font-weight-bold text-h5">
                  {{ $t("StakingSingle") }}
                </span>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text v-if="!capReached">
                <form>
                  <v-card-text>
                    <v-text-field
                      :label="
                        `${$t('Enter the staking single amount')}(${$t(
                          'At least'
                        )} ${minStakingAmount} ${tokenSymbol}, ${$t(
                          'At mostest'
                        )} ${maxStakingAmount} ${tokenSymbol})`
                      "
                      v-model="stakingAmount"
                      :error-messages="stakingAmountErrors"
                      required
                      @input="$v.stakingAmount.$touch()"
                      @blur="$v.stakingAmount.$touch()"
                      :autofocus="stakingAmountFocus"
                    ></v-text-field>
                  </v-card-text>
                  <v-card-actions class="justify-center">
                    <v-btn
                      large
                      color="#93B954"
                      dark
                      width="80%"
                      :disabled="!(submitLoading && accountAssets.balance > 0)"
                      @click="
                        accountAssets.allowanceAmount &&
                        accountAssets.allowanceAmount >= stakingAmount
                          ? submit()
                          : handleApprove()
                      "
                    >
                      {{
                        accountAssets.allowanceAmount &&
                        accountAssets.allowanceAmount >= stakingAmount
                          ? $t("Staking")
                          : $t("Approve")
                      }}
                    </v-btn>
                  </v-card-actions>
                </form>
              </v-card-text>
              <v-card-text v-else>
                <v-row align="center">
                  <v-col class="subtitle-1" cols="12">
                    {{ $t("Staking event has ended") }}
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-card>
          <!-- 其它操作 -->
          <v-card justify="center" class="fill-width mt-10">
            <v-card-title>
              <span class="title font-weight-bold text-h5">
                {{ $t("Staking History") }}
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
                  {{ $t("Staking History") }}
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
import { validationMixin } from "vuelidate";
import { required, decimal } from "vuelidate/lib/validators";
import clip from "@/utils/clipboard";
import {
  StakingLimitForSingleTokenAddress,
  StakingLimitForSingleContractAddress
} from "@/constants";
import { getContract, weiToEther, etherToWei } from "@/utils/web3";
// 引入合约 ABI 文件
import ERC20DAO from "@/constants/contractJson/ERC20DAO.json";
import StakingLimit from "@/constants/contractJson/StakingLimit.json";

export default {
  name: "StakingLimitForSingle",
  mixins: [validationMixin],
  validations: {
    stakingAmount: { required, decimal }
  },
  data: () => ({
    loading: false,
    tokenSymbol: "DAO",
    // 表单数据
    stakingAmountFocus: true,
    stakingAmount: undefined,
    // 当前账户相关信息
    accountAssets: {
      balance: 0,
      allowanceAmount: 0, // 已授权额度
      stakedAmount: 0
      // toBeReleasableAmount: 0,
      // nodeName: "None"
    },
    // 合约数据
    stakedTotalAmount: 0,
    capReached: false,
    cap: 0,
    maxStakingAmount: 0,
    minStakingAmount: 0,
    // 提示框
    operationResult: {
      color: "success",
      snackbar: false,
      text: `Hello`
    }
  }),
  created() {
    if (this.web3 && this.connected) {
      this.getInfo();
    } else {
      this.onConnect();
    }
  },
  watch: {
    web3(web3) {
      if (web3) {
        this.getInfo();
      }
    },
    address(address) {
      if (address) {
        this.getInfo();
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
    },
    stakingAmountErrors() {
      const errors = [];
      if (!this.$v.stakingAmount.$dirty) return errors;
      !this.$v.stakingAmount.decimal &&
        errors.push(this.$t("StakingSingleForm.Invalid amount"));
      !this.$v.stakingAmount.required &&
        errors.push(this.$t("StakingSingleForm.The amount is required"));

      const stakingAmountValue = parseFloat(this.$v.stakingAmount.$model);
      if (stakingAmountValue <= 0) {
        errors.push(this.$t("StakingSingleForm.The amount is be gt zero"));
      }
      if (
        stakingAmountValue > 0 &&
        stakingAmountValue < this.minStakingAmount
      ) {
        errors.push(
          this.$t("StakingSingleForm.The amount does not meet the requirements")
        );
      }
      if (
        parseFloat(stakingAmountValue) +
          parseFloat(this.accountAssets.stakedAmount) >
        this.maxStakingAmount
      ) {
        errors.push(
          this.$t("StakingSingleForm.The amount exceeds the max staking amount")
        );
      }
      if (
        parseFloat(stakingAmountValue) + parseFloat(this.stakedTotalAmount) >
        this.cap
      ) {
        errors.push(
          this.$t("StakingSingleForm.The amount exceeds the cap amount")
        );
      }
      if (stakingAmountValue > this.accountAssets.balance) {
        errors.push(
          this.$t("StakingSingleForm.The amount exceeds the balance")
        );
      }
      return errors;
    },
    submitLoading() {
      return this.stakingAmount && this.stakingAmountErrors.length <= 0;
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
    // 获取信息
    async getInfo() {
      this.loading = true;
      try {
        await this.getAccountAssets();
        await this.getContractInfo();
      } catch (error) {
        console.info(error);
      }
      this.loading = false;
    },
    // 获取账号信息
    async getAccountAssets() {
      // 查询当前账号余额
      const contractERC20DAO = getContract(
        ERC20DAO,
        StakingLimitForSingleTokenAddress,
        this.web3
      );
      const balance = await contractERC20DAO.methods
        .balanceOf(this.address)
        .call();
      const allowance = await contractERC20DAO.methods
        .allowance(this.address, StakingLimitForSingleContractAddress)
        .call();
      this.accountAssets.balance = weiToEther(balance, this.web3);
      this.accountAssets.allowanceAmount = weiToEther(allowance, this.web3);
    },
    // 获取质押合约信息
    async getContractInfo() {
      const contract = getContract(
        StakingLimit,
        StakingLimitForSingleContractAddress,
        this.web3
      );
      const stakedTotalAmount = await contract.methods
        .stakedTotalAmount()
        .call();
      this.stakedTotalAmount = weiToEther(stakedTotalAmount, this.web3);
      const cap = await contract.methods.cap().call();
      this.cap = weiToEther(cap, this.web3);
      const maxStakingAmount = await contract.methods.maxStakingAmount().call();
      this.maxStakingAmount = weiToEther(maxStakingAmount, this.web3);
      const minStakingAmount = await contract.methods.minStakingAmount().call();
      this.minStakingAmount = weiToEther(minStakingAmount, this.web3);
      this.capReached = await contract.methods.capReached().call();
      const stakingToken = await contract.methods.stakingToken().call();
      const contractERC20DAO = getContract(ERC20DAO, stakingToken, this.web3);
      this.tokenSymbol = await contractERC20DAO.methods.symbol().call();

      const tokenVestingInfo = await contract.methods
        .tokenVestingList(this.address)
        .call();
      this.accountAssets.stakedAmount = weiToEther(
        tokenVestingInfo.stakedAmount,
        this.web3
      );
      // 计算最多可质押数量
      const remainingStakingAmount =
        parseFloat(this.cap) - parseFloat(this.stakedTotalAmount);
      const enableStakingAmount =
        parseFloat(this.maxStakingAmount) -
        parseFloat(this.accountAssets.stakedAmount);
      this.maxStakingAmount =
        remainingStakingAmount < enableStakingAmount
          ? remainingStakingAmount
          : enableStakingAmount;
    },
    // 授权
    handleApprove() {
      this.loading = true;
      // 执行合约
      getContract(ERC20DAO, StakingLimitForSingleTokenAddress, this.web3)
        .methods.approve(
          StakingLimitForSingleContractAddress,
          etherToWei(this.stakingAmount, this.web3)
        )
        .send({ from: this.address })
        .then(() => {
          this.loading = false;
          this.operationResult.color = "success";
          this.operationResult.snackbar = true;
          this.operationResult.text = "Approve Success";
          this.getInfo();
        })
        .catch(e => {
          this.loading = false;
          console.info(e);
        });
    },
    // 提交
    async submit() {
      if (this.$v.$invalid) {
        // error info
        if (this.$v.stakingAmount.$invalid) {
          this.stakingAmountFocus = true;
        }
        if (this.$v.stakingDuration.$invalid) {
          this.stakingDurationFocus = true;
        }
        this.$v.$touch();
      } else {
        this.$v.$touch();
        this.loading = true;
        getContract(
          StakingLimit,
          StakingLimitForSingleContractAddress,
          this.web3
        )
          .methods.stakingTokens(etherToWei(this.stakingAmount, this.web3))
          .send({ from: this.address })
          .then(() => {
            this.loading = false;
            this.operationResult.color = "success";
            this.operationResult.snackbar = true;
            this.operationResult.text = "Staking Success";
            this.getInfo();
          })
          .catch(e => {
            this.loading = false;
            console.info(e);
          });
      }
    },
    // 跳转历史记录
    gotoHistory() {
      this.$router.push({ path: "/staking/single/history" });
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

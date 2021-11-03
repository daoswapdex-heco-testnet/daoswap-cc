<template>
  <div class="fill-height">
    <v-container v-if="web3 && connected" class="fill-height">
      <v-row justify="center">
        <v-col md="6">
          <!-- 数据显示 -->
          <v-card justify="center" class="fill-width">
            <v-card-title>
              <span class="title font-weight-bold text-h5">
                {{ $t("Status") }}
              </span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-row align="center">
                <v-col class="body-1" cols="12">
                  <p>
                    {{
                      $t("Current forging to be released") + " " + tokenSymbol
                    }}：{{ accountAssets.toBeReleasableAmount }}
                  </p>
                  <p>
                    {{ $t("Hash power node (NH) status") }}：{{
                      $t(`Node.${accountAssets.nodeName}`)
                    }}
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
                  {{ $t("BurnForging") }}
                </span>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text v-if="!capReached">
                <form>
                  <v-card-text>
                    <v-text-field
                      :label="
                        `${$t('Enter the forging amount')}(${$t(
                          'At least'
                        )} ${minBurnForgingAmount} ${tokenSymbol})`
                      "
                      v-model="forgingAmount"
                      :error-messages="forgingAmountErrors"
                      required
                      @input="$v.forgingAmount.$touch()"
                      @blur="$v.forgingAmount.$touch()"
                      :autofocus="forgingAmountFocus"
                    ></v-text-field>
                    <v-select
                      :label="$t('Choose a forging pool')"
                      v-model="forgingDuration"
                      :error-messages="forgingDurationErrors"
                      required
                      @input="$v.forgingDuration.$touch()"
                      @blur="$v.forgingDuration.$touch()"
                      :autofocus="forgingDurationFocus"
                      :disabled="
                        !forgingAmount || forgingAmount < minBurnForgingAmount
                      "
                      :items="nodeList"
                      :item-text="
                        item => {
                          return `${item.durationValue} ${$t(
                            nodeDurationUnit
                          )}, ${$t('Rate')}: ${item.rate}, ${$t(
                            'Available'
                          )}: ${forgingAmount * item.rate} ${tokenSymbol}`;
                        }
                      "
                      item-value="duration"
                      persistent-hint
                      return-object
                      single-line
                    ></v-select>
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
                        accountAssets.allowanceAmount >= forgingAmount
                          ? submit()
                          : handleApprove()
                      "
                    >
                      {{
                        accountAssets.allowanceAmount &&
                        accountAssets.allowanceAmount >= forgingAmount
                          ? $t("BurnForging")
                          : $t("Approve")
                      }}
                    </v-btn>
                  </v-card-actions>
                </form>
              </v-card-text>
              <v-card-text v-else>
                <v-row align="center">
                  <v-col class="subtitle-1" cols="12">
                    {{ $t("Forging event has ended") }}
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-card>
          <!-- 其它操作 -->
          <v-card justify="center" class="fill-width mt-10">
            <v-card-title>
              <span class="title font-weight-bold text-h5">
                {{ $t("Forging History") }}
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
                  {{ $t("Forging History") }}
                </v-btn>
              </v-card-actions>
              <v-card-actions class="justify-center">
                <v-btn
                  large
                  width="80%"
                  outlined
                  color="#93B954"
                  @click="gotoPower"
                >
                  {{ $t("Hash Mining") }}
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
import { DAOAddress, BecomeCGNContractAddress } from "@/constants";
import { getContract, weiToEther, etherToWei } from "@/utils/web3";
import { judgeCHNNodeType } from "@/filters/index";
// 引入合约 ABI 文件
import ERC20DAO from "@/constants/contractJson/ERC20DAO.json";
import BecomeCGN from "@/constants/contractJson/BecomeCGN.json";
import TokenVestingBurnForging from "@/constants/contractJson/TokenVestingBurnForging.json";

export default {
  name: "BurnForging",
  mixins: [validationMixin],
  validations: {
    forgingAmount: { required, decimal },
    forgingDuration: { required }
  },
  data: () => ({
    loading: false,
    tokenSymbol: "DAO",
    // 表单数据
    forgingAmountFocus: true,
    forgingAmount: undefined,
    forgingDurationFocus: true,
    forgingDuration: undefined,
    // 当前账户相关信息
    accountAssets: {
      balance: 0,
      allowanceAmount: 0, // 已授权额度
      toBeReleasableAmount: 0,
      nodeName: "None"
    },
    // 合约数据
    capReached: false,
    maxForgeableAmount: 0,
    minBurnForgingAmount: 1000,
    // 节点列表
    nodeRateDenominator: 1000,
    nodeDurationUnit: "minutes",
    nodeDurationUnitList: {
      minutes: 60,
      hours: 3600,
      days: 86400,
      weeks: 604800
    },
    nodeDisplay: [10, 20, 30],
    nodeList: [],
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
    },
    forgingAmountErrors() {
      const errors = [];
      if (!this.$v.forgingAmount.$dirty) return errors;
      !this.$v.forgingAmount.decimal &&
        errors.push(this.$t("BurnForgingForm.Invalid amount"));
      !this.$v.forgingAmount.required &&
        errors.push(this.$t("BurnForgingForm.The amount is required"));

      const forgingAmountValue = parseFloat(this.$v.forgingAmount.$model);
      if (forgingAmountValue <= 0) {
        errors.push(this.$t("BurnForgingForm.The amount is be gt zero"));
      }
      if (
        forgingAmountValue > 0 &&
        forgingAmountValue < this.minBurnForgingAmount
      ) {
        errors.push(
          this.$t("BurnForgingForm.The amount does not meet the requirements")
        );
      }
      if (forgingAmountValue > this.maxForgeableAmount) {
        errors.push(
          this.$t("BurnForgingForm.The amount exceeds the max forgeable amount")
        );
      }
      if (forgingAmountValue > this.accountAssets.balance) {
        errors.push(this.$t("BurnForgingForm.The amount exceeds the balance"));
      }
      return errors;
    },
    forgingDurationErrors() {
      const errors = [];
      if (!this.$v.forgingDuration.$dirty) return errors;
      !this.$v.forgingDuration.required &&
        errors.push(this.$t("BurnForgingForm.The duration is required"));

      return errors;
    },
    submitLoading() {
      return (
        this.forgingAmount &&
        this.forgingAmountErrors.length <= 0 &&
        this.forgingDuration &&
        this.forgingDurationErrors.length <= 0
      );
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
        const contractERC20DAO = getContract(ERC20DAO, DAOAddress, this.web3);
        const balance = await contractERC20DAO.methods
          .balanceOf(this.address)
          .call();
        const allowance = await contractERC20DAO.methods
          .allowance(this.address, BecomeCGNContractAddress)
          .call();
        this.accountAssets.balance = weiToEther(balance, this.web3);
        this.accountAssets.allowanceAmount = weiToEther(allowance, this.web3);
        // 查询节点信息
        const contract = getContract(
          BecomeCGN,
          BecomeCGNContractAddress,
          this.web3
        );
        const minBurnForgingAmount = await contract.methods
          .minBurnForgingAmount()
          .call();
        this.capReached = await contract.methods.capReached().call();
        this.minBurnForgingAmount = weiToEther(minBurnForgingAmount, this.web3);
        const burnedTotalAmount = await contract.methods
          .burnedTotalAmount()
          .call();
        const burnedTotalAmountFormat =
          weiToEther(burnedTotalAmount, this.web3) * 1;
        const cap = await contract.methods.cap().call();
        const capFormat = weiToEther(cap, this.web3) * 1;
        this.maxForgeableAmount = capFormat - burnedTotalAmountFormat;
        this.nodeDisplay.map(async item => {
          const duration =
            item * this.nodeDurationUnitList[this.nodeDurationUnit];
          const durationRateInfo = await contract.methods
            .durationRateList(duration)
            .call();
          this.nodeList.push({
            duration: durationRateInfo.duration,
            rate: durationRateInfo.rate / this.nodeRateDenominator,
            durationValue: item
          });
        });
        // 查询释放合约数据
        this.accountAssets.toBeReleasableAmount = 0;
        this.accountAssets.nodeName = "None";
        const vestingAddress = await contract.methods
          .getTokenVestingAddressByAccount(this.address)
          .call();
        const getResult = vestingAddress.map(async item => {
          const contractTokenVestingBurnForging = getContract(
            TokenVestingBurnForging,
            item,
            this.web3
          );
          const toBeReleasableAmount = await contractTokenVestingBurnForging.methods
            .toBeReleasableAmount(DAOAddress)
            .call();
          const toBeReleasableAmountFormat = weiToEther(
            toBeReleasableAmount,
            this.web3
          );
          this.accountAssets.toBeReleasableAmount +=
            toBeReleasableAmountFormat * 1;
        });
        await Promise.all(getResult);
        this.accountAssets.nodeName = judgeCHNNodeType(
          this.accountAssets.toBeReleasableAmount
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
      getContract(ERC20DAO, DAOAddress, this.web3)
        .methods.approve(
          BecomeCGNContractAddress,
          etherToWei(this.forgingAmount, this.web3)
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
    // 提交
    async submit() {
      if (this.$v.$invalid) {
        // error info
        if (this.$v.forgingAmount.$invalid) {
          this.forgingAmountFocus = true;
        }
        if (this.$v.forgingDuration.$invalid) {
          this.forgingDurationFocus = true;
        }
        this.$v.$touch();
      } else {
        this.$v.$touch();
        this.loading = true;
        getContract(BecomeCGN, BecomeCGNContractAddress, this.web3)
          .methods.forgingTokens(
            etherToWei(this.forgingAmount, this.web3),
            this.forgingDuration.duration
          )
          .send({ from: this.address })
          .then(() => {
            this.loading = false;
            this.operationResult.color = "success";
            this.operationResult.snackbar = true;
            this.operationResult.text = "Forging Success";
            this.getAccountAssets();
          })
          .catch(e => {
            this.loading = false;
            console.info(e);
          });
      }
    },
    // 跳转历史记录
    gotoHistory() {
      this.$router.push({ path: "/chn/forging/history" });
    },
    // 跳转算力挖矿
    gotoPower() {
      this.$router.push({ path: "/chn/power/mining" });
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

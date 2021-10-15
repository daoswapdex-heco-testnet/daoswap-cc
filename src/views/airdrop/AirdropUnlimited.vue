<template>
  <div class="fill-height">
    <v-container v-if="web3 && connected" class="fill-height">
      <v-row justify="center">
        <v-col md="6">
          <v-card class="fill-width">
            <v-card outlined>
              <v-card-title>
                <v-avatar size="24" class="mr-2">
                  <img :src="require('@/assets/logo.png')" alt="DAO" />
                </v-avatar>
                <span class="title font-weight-light">
                  {{ $t("Receive airdrop") }}
                </span>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <v-row align="center" v-if="accountAssets.isInvited">
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
                <form v-else>
                  <v-card-title>
                    <span class="headline">{{
                      $t(
                        "Please enter your mentor's address to open mystery box"
                      )
                    }}</span>
                  </v-card-title>
                  <v-card-text>
                    <v-text-field
                      :label="$t('Mentor\'s address')"
                      v-model="inviterAccount"
                      :error-messages="inviterAccountErrors"
                      required
                      @input="$v.inviterAccount.$touch()"
                      @blur="$v.inviterAccount.$touch()"
                      :autofocus="inviterAccountFocus"
                    ></v-text-field>
                    <v-text-field
                      :label="$t('Identify code')"
                      v-model="inputCode"
                      :error-messages="inputCodeErrors"
                      required
                      @input="$v.inputCode.$touch()"
                      @blur="$v.inputCode.$touch()"
                      :autofocus="inputCodeFocus"
                    >
                      <div slot="append" @click="refreshCode">
                        <s-identify :identifyCode="identifyCode"></s-identify>
                      </div>
                    </v-text-field>
                  </v-card-text>
                  <v-card-actions class="justify-center">
                    <v-btn
                      large
                      color="#93B954"
                      dark
                      width="80%"
                      :disabled="!submitLoading"
                      @click="submit"
                    >
                      {{ $t("Open") }}
                    </v-btn>
                  </v-card-actions>
                </form>
              </v-card-text>
            </v-card>
          </v-card>
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
import { required } from "vuelidate/lib/validators";
import clip from "@/utils/clipboard";
import {
  // AirdropContractAddress,
  AirdropUnlimitedContractAddress
} from "@/constants";
import {
  getContract,
  checkAddressChecksum,
  toChecksumAddress,
  weiToEther
} from "@/utils/web3";
// 引入合约 ABI 文件
import AirdropUnlimited from "@/constants/contractJson/AirdropUnlimited.json";
import SIdentify from "@/components/SIdentify.vue";

export default {
  name: "AirdropUnlimited",
  mixins: [validationMixin],
  validations: {
    inviterAccount: { required },
    inputCode: { required }
  },
  components: { SIdentify },
  data: () => ({
    loading: false,
    inviterAccountFocus: true,
    inviterAccount: undefined,
    // 当前账户相关信息
    accountAssets: {
      // enableReceive: false,
      isInvited: false,
      inviterToken: null,
      airdropAmount: 0
    },
    // 提示框
    operationResult: {
      color: "success",
      snackbar: false,
      text: `Hello`
    },
    // 随机验证码
    identifyCode: "",
    identifyCodes: "0123456789abcdwerwshdjeJKDHRJHKOOPLMKQ", //随便
    inputCodeFocus: false,
    inputCode: undefined
  }),
  created() {
    if (this.web3 && this.connected) {
      this.getAccountAssets();
    } else {
      this.onConnect();
    }
    this.refreshCode();
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
    inviterAccountErrors() {
      const errors = [];
      if (!this.$v.inviterAccount.$dirty) return errors;
      !this.$v.inviterAccount.required &&
        errors.push(this.$t("Please enter your mentor's address"));

      try {
        if (checkAddressChecksum(this.$v.inviterAccount.$model)) {
          if (
            toChecksumAddress(this.$v.inviterAccount.$model) == this.address
          ) {
            errors.push(this.$t("The inviter's account cannot be yourself"));
            return errors;
          }
          return errors;
        } else {
          errors.push(this.$t("The mentor's address is wrong"));
        }
      } catch (e) {
        errors.push(this.$t("The mentor's address is wrong"));
      }

      return errors;
    },
    inputCodeErrors() {
      const errors = [];
      if (!this.$v.inputCode.$dirty) return errors;
      !this.$v.inputCode.required &&
        errors.push(this.$t("Please enter identify code"));

      if (this.$v.inputCode.$model !== this.identifyCode) {
        errors.push(this.$t("The identify code is wrong"));
      }

      return errors;
    },
    submitLoading() {
      return (
        this.inviterAccount &&
        this.inputCode &&
        this.inviterAccountErrors.length <= 0 &&
        this.inputCodeErrors.length <= 0
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
        // 查询白名单、空投列表
        const contractUnlimited = getContract(
          AirdropUnlimited,
          AirdropUnlimitedContractAddress,
          this.web3
        );
        const hasAirdropListUnlimited = await contractUnlimited.methods
          .hasAirdropList(this.address)
          .call();
        if (hasAirdropListUnlimited) {
          this.accountAssets.isInvited = true;
          const inviteInfo = await contractUnlimited.methods
            .airdropList(this.address)
            .call();
          this.accountAssets.inviterToken = inviteInfo.inviterToken;
          this.accountAssets.airdropAmount = weiToEther(
            inviteInfo.airdropAmount,
            this.web3
          );
        } else {
          this.accountAssets.isInvited = false;
        }
      } catch (error) {
        console.info(error);
      }
      this.loading = false;
    },
    // 领取空投
    async submit() {
      if (this.$v.$invalid) {
        // error info
        if (this.$v.inviterAccount.$invalid) {
          this.inviterAccountFocus = true;
        }
        if (this.$v.inputCode.$invalid) {
          this.inputCodeFocus = true;
        }
        this.$v.$touch();
      } else {
        this.$v.$touch();
        const contract = getContract(
          AirdropUnlimited,
          AirdropUnlimitedContractAddress,
          this.web3
        );
        this.loading = true;
        // check account checkDatBalance
        const checkDatBalance = await contract.methods
          .checkDatBalance(toChecksumAddress(this.inviterAccount))
          .call();
        // check account checkDatStake
        const checkDatStake = await contract.methods
          .checkDatStake(toChecksumAddress(this.inviterAccount))
          .call();
        if (checkDatBalance || checkDatStake) {
          // 执行合约
          getContract(
            AirdropUnlimited,
            AirdropUnlimitedContractAddress,
            this.web3
          )
            .methods.receiveAirdrop(toChecksumAddress(this.inviterAccount))
            .send({ from: this.address })
            .then(() => {
              this.loading = false;
              this.refreshCode();
              this.inputCode = undefined;
              this.getAccountAssets();
            })
            .catch(e => {
              this.loading = false;
              this.refreshCode();
              this.inputCode = undefined;
              console.info(e);
            });
        } else {
          this.operationResult.color = "error";
          this.operationResult.snackbar = true;
          this.operationResult.text = "The mentor's address is wrong";
          this.loading = false;
          this.refreshCode();
          this.inputCode = undefined;
        }
      }
    },
    // 验证码相关
    refreshCode() {
      this.identifyCode = "";
      this.makeCode(this.identifyCodes, 4);
    },
    randomNum(min, max) {
      max = max + 1;
      return Math.floor(Math.random() * (max - min) + min);
    },
    // 随机生成验证码字符串
    makeCode(data, len) {
      for (let i = 0; i < len; i++) {
        this.identifyCode += data[this.randomNum(0, data.length - 1)];
      }
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

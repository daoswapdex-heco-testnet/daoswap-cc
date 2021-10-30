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
                  {{ $t("Forging History") }}
                </span>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <v-simple-table>
                  <template v-slot:default>
                    <thead>
                      <tr>
                        <th class="text-left">{{ $t("Forging Amount") }}</th>
                        <th class="text-left">{{ $t("Receive Amount") }}</th>
                        <th class="text-left">{{ $t("CHN Duration") }}</th>
                        <th class="text-left">
                          {{ $t("Releasable Amount") }} {{ tokenSymbol }}
                        </th>
                        <th class="text-left">
                          {{ $t("Released Amount") }} {{ tokenSymbol }}
                        </th>
                        <th class="text-left">{{ $t("Start") }}</th>
                        <th class="text-left">{{ $t("Operation") }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="item in vestingAddressList"
                        :key="item.duration"
                      >
                        <td>{{ item.burnedAmount }}</td>
                        <td>{{ item.receiveAmount }}</td>
                        <td>{{ item.duration | formatSeconds() }}</td>
                        <td>{{ item.releasableAmount }}</td>
                        <td>{{ item.released }}</td>
                        <td>
                          {{
                            item.start | parseTime("{y}-{m}-{d} {h}:{i}:{s}")
                          }}
                        </td>
                        <td>
                          <v-btn
                            v-if="item.releasableAmount > 0"
                            small
                            color="#93B954"
                            dark
                            width="80%"
                            @click="handleRelease(item)"
                          >
                            {{ $t("Claim") }}
                          </v-btn>
                        </td>
                      </tr>
                    </tbody>
                  </template>
                </v-simple-table>
              </v-card-text>
            </v-card>
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
import clip from "@/utils/clipboard";
import { DAOAddress, BecomeCGNContractAddress } from "@/constants";
import { getContract, weiToEther } from "@/utils/web3";
import { judgeCHNNodeType } from "@/filters/index";
// 引入合约 ABI 文件
import BecomeCGN from "@/constants/contractJson/BecomeCGN.json";
import TokenVestingBurnForging from "@/constants/contractJson/TokenVestingBurnForging.json";

export default {
  name: "BurnForgingHistory",
  data: () => ({
    loading: false,
    tokenSymbol: "DAO",
    // 当前账户相关信息
    accountAssets: {
      toBeReleasableAmount: 0,
      nodeName: "None"
    },
    // 释放合约列表
    vestingAddressList: [],
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
        // 查询节点信息
        const contract = getContract(
          BecomeCGN,
          BecomeCGNContractAddress,
          this.web3
        );
        const vestingAddress = await contract.methods
          .getTokenVestingAddressByAccount(this.address)
          .call();
        // 生成列表
        this.vestingAddressList = [];
        this.accountAssets.toBeReleasableAmount = 0;
        this.accountAssets.nodeName = "None";
        const getResult = vestingAddress.map(async item => {
          const contract = await getContract(
            TokenVestingBurnForging,
            item,
            this.web3
          );
          const burner = await contract.methods.burner().call();
          const released = await contract.methods.released(DAOAddress).call();
          const start = await contract.methods.start().call();
          const duration = await contract.methods.duration().call();
          const burnedAmount = await contract.methods.burnedAmount().call();
          const receiveAmount = await contract.methods.receiveAmount().call();
          const releasableAmount = await contract.methods
            .releasableAmount(DAOAddress)
            .call();
          const toBeReleasableAmount = await contract.methods
            .toBeReleasableAmount(DAOAddress)
            .call();
          const tempVesting = {
            contractAddress: item,
            burner: burner,
            released: weiToEther(released, this.web3),
            start: start,
            duration: duration,
            releasableAmount: weiToEther(releasableAmount, this.web3),
            toBeReleasableAmount: weiToEther(toBeReleasableAmount, this.web3),
            burnedAmount: weiToEther(burnedAmount, this.web3),
            receiveAmount: weiToEther(receiveAmount, this.web3)
          };
          this.vestingAddressList.push(tempVesting);
          this.accountAssets.toBeReleasableAmount +=
            tempVesting.toBeReleasableAmount * 1;
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
    // 提取DAO
    handleRelease(record) {
      this.loading = true;
      // 执行合约
      getContract(TokenVestingBurnForging, record.contractAddress, this.web3)
        .methods.release(DAOAddress)
        .send({ from: this.address })
        .then(() => {
          this.loading = false;
          this.operationResult.snackbar = true;
          this.operationResult.text = "Claim Success";
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

<template>
  <div class="fill-height">
    <v-container v-if="web3 && connected" class="fill-height">
      <v-row justify="center">
        <v-col md="6">
          <!-- 数据显示 -->
          <v-card justify="center" class="fill-width">
            <v-card-title>
              <span class="title font-weight-light">
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
                    }}：{{ accountAssets.releasableAmount }}
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
                <span class="title font-weight-light">
                  {{ $t("Computing power mining") }}
                </span>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <v-simple-table>
                  <template v-slot:default>
                    <thead>
                      <tr>
                        <th class="text-left">
                          {{ $t("Power Column Duration") }}
                        </th>
                        <th class="text-left">
                          {{ $t("Power Column Power") }}<br />(USDT)
                        </th>
                        <th class="text-left">
                          {{ $t("Power Column ClaimableAmount") }}<br />({{
                            tokenSymbol
                          }})
                        </th>
                        <th class="text-left">
                          {{ $t("Power Column AnnualizedRate") }}
                        </th>
                        <th class="text-left">{{ $t("Operation") }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in powerDataList" :key="item.duration">
                        <td>
                          {{ item.startTime | parseTime("{y}{m}{d}") }}
                          {{ $t("to") }}
                          {{ item.endTime | parseTime("{y}{m}{d}") }}
                        </td>
                        <td>{{ item.powerInfo.power }}</td>
                        <td>{{ item.powerInfo.receiveAmount }}</td>
                        <td>{{ item.annualizedRate }} %</td>
                        <td>
                          <v-btn
                            v-if="
                              item.powerInfo.receiveAmount > 0 && !item.isClaim
                            "
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
// 引入合约 ABI 文件
import ERC20DAO from "@/constants/contractJson/ERC20DAO.json";
import BecomeCGN from "@/constants/contractJson/BecomeCGN.json";
import ComputingPowerMining from "@/constants/contractJson/ComputingPowerMining.json";

export default {
  name: "ComputingPowerMining",
  data: () => ({
    loading: false,
    tokenSymbol: "DAO",
    // 当前账户相关信息
    accountAssets: {
      releasableAmount: 0,
      nodeName: "None"
    },
    // 算力合约列表
    powerContractAddressList: ["0x74E4A1F855DD917CCD222E24b45da68F38fb32f7"],
    // 算力数据列表
    powerDataList: [],
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
      // return "0x3DdcFc89B4DD2b33d9a8Ca0F60180527E9810D4B";
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
        const contractERC20DAO = getContract(ERC20DAO, DAOAddress, this.web3);
        const contract = getContract(
          BecomeCGN,
          BecomeCGNContractAddress,
          this.web3
        );
        const vestingAddress = await contract.methods
          .getTokenVestingAddressByAccount(this.address)
          .call();
        // 生成列表
        this.accountAssets.releasableAmount = 0;
        this.accountAssets.nodeName = "None";
        const getResult = vestingAddress.map(async item => {
          // 查询余额
          const balance = await contractERC20DAO.methods.balanceOf(item).call();
          const balanceFormat = weiToEther(balance, this.web3);
          this.accountAssets.releasableAmount =
            this.accountAssets.releasableAmount + balanceFormat * 1;
        });
        await Promise.all(getResult);
        if (
          this.accountAssets.releasableAmount >= 10 &&
          this.accountAssets.releasableAmount < 20
        ) {
          this.accountAssets.nodeName = "Planetary node";
        } else if (this.accountAssets.releasableAmount >= 20) {
          this.accountAssets.nodeName = "Stellar node";
        }
        await this.getPowerDataList();
      } catch (error) {
        console.info(error);
      }
      this.loading = false;
    },
    // 获取算力数据列表
    async getPowerDataList() {
      if (this.powerContractAddressList.length > 0) {
        this.loading = true;
        const getResult = this.powerContractAddressList.map(async item => {
          const contract = await getContract(
            ComputingPowerMining,
            item,
            this.web3
          );
          const hasPowerInfo = await contract.methods
            .hasPowerInfo(this.address)
            .call();
          if (hasPowerInfo) {
            const totalReleaseAmount = await contract.methods
              .totalReleaseAmount()
              .call();
            const totalSwappedAmount = await contract.methods
              .totalSwappedAmount()
              .call();
            const countedPower = await contract.methods.countedPower().call();
            const startTime = await contract.methods.startTime().call();
            const endTime = await contract.methods.endTime().call();
            const powerInfo = await contract.methods
              .accountPowerInfoList(this.address)
              .call();
            const annualizedRate =
              (powerInfo.receiveAmount / powerInfo.unreleasedAmount) * 100;
            const tempData = {
              contractAddress: item,
              totalReleaseAmount: weiToEther(totalReleaseAmount, this.web3),
              totalSwappedAmount: weiToEther(totalSwappedAmount, this.web3),
              countedPower: weiToEther(countedPower, this.web3),
              startTime: startTime,
              endTime: endTime,
              powerInfo: {
                power: weiToEther(powerInfo.power, this.web3),
                receiveAmount: weiToEther(powerInfo.receiveAmount, this.web3),
                isClaim: powerInfo.isClaim
              },
              annualizedRate: parseFloat(annualizedRate).toFixed(2)
            };
            this.powerDataList.push(tempData);
          }
        });
        await Promise.all(getResult);
        this.loading = true;
      }
    },
    // 提取DAO
    handleRelease(record) {
      this.loading = true;
      // 执行合约
      getContract(ComputingPowerMining, record.contractAddress, this.web3)
        .methods.claim()
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
